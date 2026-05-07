import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getOpenAI, buildAiGenerationSystemPrompt } from "@/lib/openai";
import { streamChatCompletionJson } from "@/lib/ai-completion";
import { buildTimeoutFallbackTemplate } from "@/lib/ai-fallback-template";
import { createClient } from "@/lib/supabase/server";
import { canGenerateAI } from "@/lib/plan";
import { limitAiGeneration } from "@/lib/ratelimit";
import type { AITemplatePayload } from "@/types/template";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const rl = await limitAiGeneration(user.id);
  if (!rl.ok) {
    return NextResponse.json({ error: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.", retryAfter: rl.retryAfter }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("ai_credits").eq("id", user.id).single();

  if (!profile) return NextResponse.json({ error: "프로필을 찾을 수 없어요." }, { status: 400 });

  const creditsBefore = profile.ai_credits ?? 0;
  if (!canGenerateAI(creditsBefore)) {
    return NextResponse.json(
      { error: "AI 크레딧이 없어요. 충전한 뒤 다시 시도해 주세요.", code: "NO_CREDITS" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null) as {
    prompt?: string;
    currentTitle?: string;
    currentBlocksSummary?: string;
  } | null;
  if (!body?.prompt?.trim()) {
    return NextResponse.json({ error: "프롬프트를 입력해 주세요." }, { status: 400 });
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
        return NextResponse.json({ error: "AI 응답을 해석하지 못했어요." }, { status: 502 });
      }
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "AI 생성에 실패했어요." }, { status: 502 });
  }

  let creditsRemaining = creditsBefore;

  if (usedCredit) {
    const { data: updatedProfile, error: creditErr } = await supabase
      .from("profiles")
      .update({ ai_credits: creditsBefore - 1 })
      .eq("id", user.id)
      .eq("ai_credits", creditsBefore)
      .select("ai_credits")
      .single();

    if (creditErr || updatedProfile == null) {
      return NextResponse.json(
        { error: "크레딧 차감에 실패했어요. 잠시 후 다시 시도해 주세요.", code: "CREDIT_RACE" },
        { status: 409 }
      );
    }

    creditsRemaining = updatedProfile.ai_credits ?? 0;

    await supabase.from("ai_logs").insert({
      user_id: user.id,
      prompt: body.prompt,
      model: "gpt-4o",
      tokens_used: completionTokens,
    });
  } else {
    await supabase.from("ai_logs").insert({
      user_id: user.id,
      prompt: `[timeout fallback regenerate] ${body.prompt}`,
      model: "gpt-4o",
      tokens_used: completionTokens,
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
