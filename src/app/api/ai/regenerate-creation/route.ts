import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { limitAiGeneration } from "@/lib/ratelimit";
import { CREDITS_PER_GENERATION, deductAiCreditsAtomic } from "@/lib/ai-credits";
import {
  generateDocumentBlocksJson,
  generatePresentationJson,
  generateImageUrl,
  pickGenerationTitle,
} from "@/lib/ai-generate-executors";
import { normalizeDocumentBlocksFromAi, type CreationType } from "@/types/template";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const rl = await limitAiGeneration(user.id);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly.", retryAfter: rl.retryAfter },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null) as {
    templateId?: string;
    feedback?: string;
  } | null;
  const templateId = body?.templateId?.trim();
  if (!templateId) return NextResponse.json({ error: "Missing creation id." }, { status: 400 });

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

  const { data: tpl, error: selErr } = await supabase
    .from("templates")
    .select("id, user_id, creation_type, ai_prompt, title")
    .eq("id", templateId)
    .maybeSingle();
  if (selErr || !tpl) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (tpl.user_id !== user.id) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  const creationType = (tpl.creation_type ?? "template") as CreationType;
  if (creationType === "template") {
    return NextResponse.json({ error: "Use the editor's Regenerate for templates." }, { status: 400 });
  }

  const basePrompt = (tpl.ai_prompt ?? "").trim();
  if (!basePrompt) {
    return NextResponse.json(
      { error: "No original prompt is stored for this creation; regenerate is unavailable." },
      { status: 400 }
    );
  }
  const prompt = body?.feedback?.trim()
    ? `${basePrompt}\n\nAdditional direction:\n${body.feedback.trim()}`
    : basePrompt;

  let content: Record<string, unknown>;
  let newTitle = tpl.title as string;
  let tokens: number | null = null;

  try {
    if (creationType === "document") {
      const doc = await generateDocumentBlocksJson(prompt);
      tokens = doc.tokens;
      let blocks = normalizeDocumentBlocksFromAi(doc.blocks);
      if (blocks.length === 0) {
        blocks = normalizeDocumentBlocksFromAi([
          { type: "heading", level: 1, text: pickGenerationTitle(prompt) },
          { type: "paragraph", text: " " },
        ]);
      }
      content = { blocks };
      newTitle = pickGenerationTitle(prompt);
    } else if (creationType === "presentation") {
      const p = await generatePresentationJson(prompt);
      tokens = p.tokens;
      content = { title: p.deckTitle, slides: p.slides };
      newTitle = p.deckTitle;
    } else if (creationType === "image") {
      const img = await generateImageUrl(prompt);
      content = { imageUrl: img.imageUrl, prompt: basePrompt };
      newTitle = pickGenerationTitle(prompt);
    } else {
      return NextResponse.json({ error: "Unsupported creation type." }, { status: 400 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "AI regeneration failed." }, { status: 502 });
  }

  const creditResult = await deductAiCreditsAtomic(supabase, user.id, creditsBefore, CREDITS_PER_GENERATION);
  if ("error" in creditResult) {
    return NextResponse.json(
      { error: creditResult.error, code: creditResult.code },
      { status: creditResult.code === "NO_CREDITS" ? 403 : 409 }
    );
  }

  const { error: upErr } = await supabase
    .from("templates")
    .update({
      title: newTitle,
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", templateId)
    .eq("user_id", user.id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  await supabase.from("ai_logs").insert({
    user_id: user.id,
    prompt,
    model: "gpt-4o",
    tokens_used: tokens,
    classified_type: creationType,
    generation_type: creationType,
    charged_credits: CREDITS_PER_GENERATION,
  });

  return NextResponse.json({
    ok: true,
    title: newTitle,
    content,
    creditsRemaining: creditResult.creditsRemaining,
    chargedCredits: CREDITS_PER_GENERATION,
  });
}
