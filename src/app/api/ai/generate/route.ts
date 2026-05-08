import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getOpenAI, buildAiGenerationSystemPrompt } from "@/lib/openai";
import { streamChatCompletionJson } from "@/lib/ai-completion";
import { buildTimeoutFallbackTemplate } from "@/lib/ai-fallback-template";
import { createClient } from "@/lib/supabase/server";
import { limitAiGeneration } from "@/lib/ratelimit";
import { creditsForCreationType, deductAiCreditsAtomic } from "@/lib/ai-credits";
import type { AIGeneratePayload } from "@/types/template";
import { classifyPrompt } from "@/lib/ai-classifier";
import {
  generateDocumentBlocksJson,
  generatePresentationJson,
  generateImageUrl,
  pickGenerationTitle,
} from "@/lib/ai-generate-executors";

export const runtime = "nodejs";
export const maxDuration = 120;

type GenerateBody = { prompt?: string };

function pickTitle(prompt: string): string {
  return pickGenerationTitle(prompt);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const rl = await limitAiGeneration(user.id);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly.", retryAfter: rl.retryAfter },
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
    return NextResponse.json({ error: "Profile not found." }, { status: 400 });
  }

  let body: GenerateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request format." }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Please enter a prompt." }, { status: 400 });
  }

  const classifiedType = await classifyPrompt(prompt);
  const creditsBefore = profile.ai_credits ?? 0;
  const charge = creditsForCreationType(classifiedType);
  if (creditsBefore < charge) {
    return NextResponse.json(
      { error: `Not enough AI credits. ${charge} credits are required.`, code: "NO_CREDITS" },
      { status: 403 }
    );
  }

  let payload: AIGeneratePayload;
  let completionTokens: number | null = null;
  let warning: string | undefined;
  try {
    if (classifiedType === "document") {
      const doc = await generateDocumentBlocksJson(prompt);
      completionTokens = doc.tokens;
      let blocks = Array.isArray(doc.blocks) ? doc.blocks : [];
      if (blocks.length === 0) {
        blocks = [
          { type: "heading", level: 1, text: pickTitle(prompt) },
          { type: "paragraph", text: " " },
        ];
      }
      payload = {
        creationType: "document",
        title: pickTitle(prompt),
        icon: "📝",
        blocks,
      };
    } else if (classifiedType === "presentation") {
      const p = await generatePresentationJson(prompt);
      completionTokens = p.tokens;
      payload = {
        creationType: "presentation",
        title: p.deckTitle,
        icon: "📊",
        slides: p.slides,
      };
    } else if (classifiedType === "image") {
      const img = await generateImageUrl(prompt);
      payload = { creationType: "image", title: pickTitle(prompt), icon: "🖼️", imageUrl: img.imageUrl };
    } else {
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
        `Request:\n${prompt}`,
      ].join("\n");
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
        const fb = buildTimeoutFallbackTemplate(prompt);
        payload = { creationType: "template", ...fb };
        warning = "AI generation timed out, so a fallback template was applied.";
      } else {
        payload = { creationType: "template", ...(JSON.parse(raw) as { title: string; icon?: string; cover?: string; blocks: unknown[] }) };
      }
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "AI generation request failed." }, { status: 502 });
  }

  const creditResult = await deductAiCreditsAtomic(supabase, user.id, creditsBefore, charge);
  if ("error" in creditResult) {
    return NextResponse.json({ error: creditResult.error, code: creditResult.code }, { status: creditResult.code === "NO_CREDITS" ? 403 : 409 });
  }
  const creditsRemaining = creditResult.creditsRemaining;

  await supabase.from("ai_logs").insert({
    user_id: user.id,
    prompt,
    model: "gpt-4o",
    tokens_used: completionTokens,
    classified_type: classifiedType,
    generation_type: payload.creationType,
    charged_credits: charge,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };
      send({ type: "progress", message: `Generating ${payload.creationType}...` });
      if (payload.creationType === "template") {
        const blocks = Array.isArray(payload.blocks) ? payload.blocks : [];
        for (let i = 0; i < blocks.length; i++) {
          send({ type: "block", block: blocks[i] });
          await new Promise((r) => setTimeout(r, 50));
        }
      } else {
        send({ type: "content", payload });
      }
      send({
        type: "done",
        payload,
        creditsRemaining,
        usedCredit: true,
        chargedCredits: charge,
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
