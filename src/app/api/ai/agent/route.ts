import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { limitAiGeneration } from "@/lib/ratelimit";
import {
  canUseAgentAction,
  normalizePlan,
  type AgentAction,
  DAILY_AI_LIMITS,
} from "@/lib/subscription";
import { getTodayAIUsage, checkDailyAI, checkSlideLimit } from "@/lib/deck-limits";
import {
  generatePresentationJson,
  generateOutlineJson,
  rewriteSlideJson,
  reviewDeckJson,
} from "@/lib/ai-generate-executors";
import {
  normalizePresentationSlides,
  type PresentationContent,
  type PresentationSlide,
} from "@/types/template";

export const runtime = "nodejs";
export const maxDuration = 120;

type AgentBody = {
  deckId?: string;
  action?: AgentAction;
  prompt?: string;
  currentSlideIndex?: number;
  context?: Record<string, unknown>;
};

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const rl = await limitAiGeneration(user.id);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests.", retryAfter: rl.retryAfter }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan = normalizePlan(profile?.plan);
  const usage = await getTodayAIUsage(user.id);
  const dailyCheck = checkDailyAI(plan, usage);
  if (!dailyCheck.ok) {
    return NextResponse.json({ error: dailyCheck.message, code: "daily_limit" }, { status: 403 });
  }

  let body: AgentBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const action = body.action;
  const prompt = (body.prompt ?? "").trim();
  if (!action) return NextResponse.json({ error: "action is required." }, { status: 400 });

  if (!canUseAgentAction(plan, action)) {
    return NextResponse.json(
      { error: "This feature requires a higher plan.", code: "upgrade_required" },
      { status: 403 }
    );
  }

  let deckContent: PresentationContent | null = null;
  let deckTitle = "Untitled deck";

  if (body.deckId) {
    const { data: deck } = await supabase
      .from("templates")
      .select("id, user_id, title, content, creation_type")
      .eq("id", body.deckId)
      .maybeSingle();
    if (!deck || deck.user_id !== user.id || deck.creation_type !== "presentation") {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }
    deckContent = (deck.content ?? { slides: [] }) as PresentationContent;
    deckTitle = deck.title;
  }

  const slides = normalizePresentationSlides(deckContent?.slides ?? []);
  const slideIndex = Math.max(0, Math.min(body.currentSlideIndex ?? 0, Math.max(0, slides.length - 1)));

  let message = "";
  let updatedSlides: PresentationSlide[] | undefined;
  let updatedTitle: string | undefined;
  let outline: string | undefined;

  try {
    switch (action) {
      case "generate_deck": {
        if (!prompt) return NextResponse.json({ error: "prompt is required." }, { status: 400 });
        const maxSlides = plan === "free" ? 10 : plan === "plus" ? 50 : 100;
        const gen = await generatePresentationJson(prompt, maxSlides);
        updatedTitle = gen.deckTitle;
        updatedSlides = gen.slides;
        message = `Generated **${gen.slides.length} slides** for "${gen.deckTitle}".`;
        break;
      }
      case "generate_outline": {
        if (!prompt) return NextResponse.json({ error: "prompt is required." }, { status: 400 });
        outline = await generateOutlineJson(prompt);
        message = outline;
        break;
      }
      case "add_speaker_notes": {
        const slide = slides[slideIndex];
        if (!slide) return NextResponse.json({ error: "No slide selected." }, { status: 400 });
        const gen = await rewriteSlideJson(
          slide,
          prompt || "Add detailed speaker notes in the notes field."
        );
        const next = [...slides];
        next[slideIndex] = gen;
        updatedSlides = next;
        message = `Added speaker notes to slide ${slideIndex + 1}.`;
        break;
      }
      case "rewrite_slide": {
        const slide = slides[slideIndex];
        if (!slide) return NextResponse.json({ error: "No slide selected." }, { status: 400 });
        const gen = await rewriteSlideJson(slide, prompt || "Improve clarity and impact.");
        const next = [...slides];
        next[slideIndex] = gen;
        updatedSlides = next;
        message = `Rewrote slide ${slideIndex + 1}.`;
        break;
      }
      case "add_slide": {
        const limit = plan === "free" ? 10 : plan === "plus" ? 50 : 9999;
        const slideCheck = checkSlideLimit(plan, slides.length);
        if (!slideCheck.ok) {
          return NextResponse.json({ error: slideCheck.message, code: "upgrade_required" }, { status: 403 });
        }
        const gen = await generatePresentationJson(
          prompt || "Add one slide with heading and bullet points.",
          1
        );
        if (gen.slides[0]) {
          updatedSlides = [...slides, gen.slides[0]].slice(0, limit);
          message = `Added slide: ${gen.slides[0].title}`;
        }
        break;
      }
      case "web_research":
      case "generate_script":
      case "style_unify":
      case "ai_rewrite":
      case "compress":
      case "expand":
      case "audience_optimize":
      case "competitive_analysis":
      case "tone_transform": {
        if (!prompt) return NextResponse.json({ error: "prompt is required." }, { status: 400 });
        const gen = await generatePresentationJson(
          `${action.replace(/_/g, " ")}: ${prompt}\n\nCurrent deck:\n${JSON.stringify(slides)}`,
          plan === "free" ? 10 : 50
        );
        updatedSlides = gen.slides;
        message = `Applied **${action.replace(/_/g, " ")}** to your deck.`;
        break;
      }
      case "review_deck": {
        message = await reviewDeckJson(deckTitle, slides);
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI request failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (body.deckId && updatedSlides) {
    await supabase
      .from("templates")
      .update({
        title: updatedTitle ?? deckTitle,
        content: { title: updatedTitle ?? deckTitle, slides: updatedSlides },
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.deckId)
      .eq("user_id", user.id);
  }

  await supabase.from("ai_usage").insert({
    user_id: user.id,
    action,
    deck_id: body.deckId ?? null,
  });

  const remaining = Math.max(0, DAILY_AI_LIMITS[plan] - usage - 1);

  return NextResponse.json({
    message,
    outline,
    updatedSlides,
    updatedTitle,
    usageToday: usage + 1,
    usageRemaining: remaining,
  });
}
