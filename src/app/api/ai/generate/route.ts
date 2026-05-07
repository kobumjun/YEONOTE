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
export const maxDuration = 120;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const rl = await limitAiGeneration(user.id);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.", retryAfter: rl.retryAfter },
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
    return NextResponse.json({ error: "프로필을 찾을 수 없어요." }, { status: 400 });
  }

  const creditsBefore = profile.ai_credits ?? 0;
  if (!canGenerateAI(creditsBefore)) {
    return NextResponse.json(
      { error: "AI 크레딧이 없어요. 충전한 뒤 다시 시도해 주세요.", code: "NO_CREDITS" },
      { status: 403 }
    );
  }

  let body: { prompt?: string; tags?: string[]; style?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
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
  const userMessage = [
    `Today's date (YYYY-MM-DD): ${today}`,
    `Calendar month for day-by-day checklists: ${ym} (include every calendar day 1–${lastDay} in this month, each as its own checklist line with weekday label in the user's language).`,
    "Table date columns: leave every cell value as empty string \"\" in all rows (no prefilled dates).",
    body.tags?.length ? `Tags: ${body.tags.join(", ")}` : "",
    body.style ? `Style: ${body.style}` : "",
    `Request:\n${prompt}`,
  ]
    .filter(Boolean)
    .join("\n");

  let parsed: AITemplatePayload;
  let usedCredit = true;
  let completionTokens: number | null = null;

  try {
    const { raw, timedOut, usageTokens } = await streamChatCompletionJson(openai, {
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });
    completionTokens = usageTokens;

    if (timedOut || !raw.trim()) {
      parsed = buildTimeoutFallbackTemplate(prompt);
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
      prompt,
      model: "gpt-4o",
      tokens_used: completionTokens,
    });
  } else {
    await supabase.from("ai_logs").insert({
      user_id: user.id,
      prompt: `[timeout fallback] ${prompt}`,
      model: "gpt-4o",
      tokens_used: completionTokens,
    });
  }

  const encoder = new TextEncoder();
  const blocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
  const warning = usedCredit
    ? undefined
    : "AI 생성이 시간 안에 끝나지 않아 기본 템플릿이 적용됐어요. 크레딧은 사용되지 않았어요. 짧게 다시 시도해 보세요.";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };
      send({ type: "progress", message: usedCredit ? "템플릿 구조를 잡는 중…" : "기본 템플릿 적용 중…" });
      await new Promise((r) => setTimeout(r, 200));
      send({ type: "progress", message: "블록 생성 중…" });
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
        usedCredit,
        warning,
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
