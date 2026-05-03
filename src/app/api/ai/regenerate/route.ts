import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getOpenAI, buildAiGenerationSystemPrompt } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";
import { canGenerateAI } from "@/lib/plan";
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
  const { data: profile } = await supabase.from("profiles").select("ai_credits").eq("id", user.id).single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 400 });

  const creditsBefore = profile.ai_credits ?? 0;
  if (!canGenerateAI(creditsBefore)) {
    return NextResponse.json(
      { error: "You are out of AI credits. Top up and try again.", code: "NO_CREDITS" },
      { status: 403 }
    );
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
  const { content: systemPrompt } = buildAiGenerationSystemPrompt();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Regenerate the full template incorporating this feedback. Current title: ${body.currentTitle ?? ""}\nSummary of blocks: ${body.currentBlocksSummary ?? ""}\n\nFeedback:\n${body.prompt}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 8000,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return NextResponse.json({ error: "Empty AI response" }, { status: 502 });

  let parsed: AITemplatePayload;
  try {
    parsed = JSON.parse(raw) as AITemplatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid AI JSON" }, { status: 502 });
  }

  const { data: updatedProfile, error: creditErr } = await supabase
    .from("profiles")
    .update({ ai_credits: creditsBefore - 1 })
    .eq("id", user.id)
    .eq("ai_credits", creditsBefore)
    .select("ai_credits")
    .single();

  if (creditErr || updatedProfile == null) {
    return NextResponse.json(
      { error: "Failed to deduct credits. Please try again shortly.", code: "CREDIT_RACE" },
      { status: 409 }
    );
  }

  const creditsRemaining = updatedProfile.ai_credits ?? 0;

  await supabase.from("ai_logs").insert({
    user_id: user.id,
    prompt: body.prompt,
    model: "gpt-4o",
    tokens_used: completion.usage?.total_tokens ?? null,
  });

  return NextResponse.json({ ...parsed, creditsRemaining });
}
