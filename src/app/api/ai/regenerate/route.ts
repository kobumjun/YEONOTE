import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getOpenAI, buildAiGenerationSystemPrompt } from "@/lib/openai";
import { streamChatCompletionJson } from "@/lib/ai-completion";
import { buildTimeoutFallbackTemplate } from "@/lib/ai-fallback-template";
import { createClient } from "@/lib/supabase/server";
import { limitAiGeneration } from "@/lib/ratelimit";
import type { AITemplatePayload } from "@/types/template";
import { CREDITS_PER_GENERATION, deductAiCreditsAtomic } from "@/lib/ai-credits";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const rl = await limitAiGeneration(user.id);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly.", retryAfter: rl.retryAfter }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("ai_credits").eq("id", user.id).single();

  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 400 });

  const creditsBefore = profile.ai_credits ?? 0;
  if (creditsBefore < CREDITS_PER_GENERATION) {
    return NextResponse.json(
      { error: `Not enough AI credits. ${CREDITS_PER_GENERATION} credits are required.`, code: "NO_CREDITS" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null) as {
    prompt?: string;
    currentTitle?: string;
    currentBlocksSummary?: string;
    creationType?: string;
  } | null;
  if (!body?.prompt?.trim()) {
    return NextResponse.json({ error: "Please enter a prompt." }, { status: 400 });
  }
  if (body.creationType && body.creationType !== "template") {
    return NextResponse.json({ error: "Regenerate currently supports template creations only." }, { status: 400 });
  }

  const openai = getOpenAI();
  const { content: systemPrompt } = buildAiGenerationSystemPrompt();
  const today = new Date().toISOString().slice(0, 10);
  const cal = new Date();
  const y = cal.getFullYear();
  const mo = cal.getMonth();
  const lastDay = new Date(y, mo + 1, 0).getDate();
  const ym = `${y}-${String(mo + 1).padStart(2, "0")}`;

  let parsed: AITemplatePayload;
  let usedCredit = true;
  let completionTokens: number | null = null;

  try {
    const { raw, timedOut, usageTokens } = await streamChatCompletionJson(openai, {
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Today's date (YYYY-MM-DD): ${today}\nCalendar month for day-by-day checklists: ${ym} (every day 1–${lastDay}; weekday labels in the user's language).\nTable date columns: use empty string \"\" for all row cells — do not prefill dates.\n\nRegenerate the full template incorporating this feedback. Current title: ${body.currentTitle ?? ""}\nSummary of blocks: ${body.currentBlocksSummary ?? ""}\n\nFeedback:\n${body.prompt}`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });
    completionTokens = usageTokens;

    if (timedOut || !raw.trim()) {
      parsed = buildTimeoutFallbackTemplate(body.prompt);
      usedCredit = false;
    } else {
      try {
        parsed = JSON.parse(raw) as AITemplatePayload;
      } catch {
        return NextResponse.json({ error: "Failed to parse AI response." }, { status: 502 });
      }
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "AI generation request failed." }, { status: 502 });
  }

  let creditsRemaining = creditsBefore;

  if (usedCredit) {
    const creditResult = await deductAiCreditsAtomic(supabase, user.id, creditsBefore, CREDITS_PER_GENERATION);
    if ("error" in creditResult) {
      return NextResponse.json({ error: creditResult.error, code: creditResult.code }, { status: creditResult.code === "NO_CREDITS" ? 403 : 409 });
    }
    creditsRemaining = creditResult.creditsRemaining;

    await supabase.from("ai_logs").insert({
      user_id: user.id,
      prompt: body.prompt,
      model: "gpt-4o",
      tokens_used: completionTokens,
      classified_type: "template",
      generation_type: "template",
      charged_credits: CREDITS_PER_GENERATION,
    });
  } else {
    await supabase.from("ai_logs").insert({
      user_id: user.id,
      prompt: `[timeout fallback regenerate] ${body.prompt}`,
      model: "gpt-4o",
      tokens_used: completionTokens,
      classified_type: "template",
      generation_type: "template",
      charged_credits: 0,
    });
  }

  const warning = usedCredit
    ? undefined
    : "AI regeneration timed out — starter template applied. No credit was used.";

  return NextResponse.json({
    ...parsed,
    creditsRemaining,
    usedCredit,
    warning,
  });
}
