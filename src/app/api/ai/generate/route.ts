import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getOpenAI, TEMPLATE_SYSTEM_PROMPT } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";
import { canGenerateAI } from "@/lib/plan";
import { limitAiGeneration } from "@/lib/ratelimit";
import type { AITemplatePayload } from "@/types/template";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await limitAiGeneration(user.id);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rl.retryAfter },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("ai_credits")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 400 });
  }

  const creditsBefore = profile.ai_credits ?? 0;
  if (!canGenerateAI(creditsBefore)) {
    return NextResponse.json(
      { error: "You are out of AI credits. Top up and try again.", code: "NO_CREDITS" },
      { status: 403 }
    );
  }

  let body: { prompt?: string; tags?: string[]; style?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  }

  const openai = getOpenAI();
  const userMessage = [
    body.tags?.length ? `Tags: ${body.tags.join(", ")}` : "",
    body.style ? `Style: ${body.style}` : "",
    `Request:\n${prompt}`,
  ]
    .filter(Boolean)
    .join("\n");

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: TEMPLATE_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
  }

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
  }

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

  const tokens = completion.usage?.total_tokens ?? null;

  await supabase.from("ai_logs").insert({
    user_id: user.id,
    prompt,
    model: "gpt-4o",
    tokens_used: tokens,
  });

  const encoder = new TextEncoder();
  const blocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };
      send({ type: "progress", message: "Structuring your template..." });
      await new Promise((r) => setTimeout(r, 200));
      send({ type: "progress", message: "Generating blocks..." });
      for (let i = 0; i < blocks.length; i++) {
        send({ type: "block", block: blocks[i] });
        await new Promise((r) => setTimeout(r, 80 + Math.min(i * 5, 120)));
      }
      send({
        type: "done",
        title: parsed.title,
        icon: parsed.icon,
        cover: parsed.cover,
        creditsRemaining,
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
