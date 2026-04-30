import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getOpenAI, TEMPLATE_SYSTEM_PROMPT } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";
import {
  canGenerateAI,
  FREE_MONTHLY_AI,
  nextResetFrom,
  shouldResetUsage,
} from "@/lib/plan";
import { limitAiGeneration } from "@/lib/ratelimit";
import type { AITemplatePayload } from "@/types/template";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await limitAiGeneration(user.id);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests", retryAfter: rl.retryAfter }, { status: 429 });
  }

  const supabase = await createClient();
  let { data: profile } = await supabase
    .from("profiles")
    .select("plan, ai_generations_used, ai_generations_reset_at")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 400 });

  if (shouldResetUsage(profile.ai_generations_reset_at)) {
    await supabase
      .from("profiles")
      .update({ ai_generations_used: 0, ai_generations_reset_at: nextResetFrom() })
      .eq("id", user.id);
    profile = { ...profile, ai_generations_used: 0, ai_generations_reset_at: nextResetFrom() };
  }

  const plan = profile.plan ?? "free";
  if (!canGenerateAI(plan, profile.ai_generations_used ?? 0, profile.ai_generations_reset_at)) {
    return NextResponse.json({ error: `Free plan allows ${FREE_MONTHLY_AI} AI generations per month.` }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as {
    prompt?: string;
    currentTitle?: string;
    currentBlocksSummary?: string;
  } | null;
  if (!body?.prompt?.trim()) {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  }

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: TEMPLATE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Regenerate the full template incorporating this feedback. Current title: ${body.currentTitle ?? ""}\nSummary of blocks: ${body.currentBlocksSummary ?? ""}\n\nFeedback:\n${body.prompt}`,
      },
    ],
    temperature: 0.7,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return NextResponse.json({ error: "Empty AI response" }, { status: 502 });

  let parsed: AITemplatePayload;
  try {
    parsed = JSON.parse(raw) as AITemplatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid AI JSON" }, { status: 502 });
  }

  await supabase.from("ai_logs").insert({
    user_id: user.id,
    prompt: body.prompt,
    model: "gpt-4o",
    tokens_used: completion.usage?.total_tokens ?? null,
  });

  if (plan === "free") {
    await supabase
      .from("profiles")
      .update({ ai_generations_used: (profile.ai_generations_used ?? 0) + 1 })
      .eq("id", user.id);
  }

  return NextResponse.json(parsed);
}
