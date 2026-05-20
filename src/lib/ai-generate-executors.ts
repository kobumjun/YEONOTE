import { getOpenAI } from "@/lib/openai";
import type { PresentationSlide } from "@/types/template";
import { normalizePresentationSlide } from "@/types/template";

export function pickGenerationTitle(prompt: string): string {
  return prompt.slice(0, 80).trim() || "Untitled";
}

export const PRESENTATION_SYSTEM = `You are a McKinsey-level presentation strategist. You create slide decks that look professional and insight-driven.

Return ONLY valid JSON:
{
  "title": "Deck Title",
  "slides": [
    {
      "title": "Slide Title That Communicates the Insight",
      "elements": [ ... ],
      "notes": "Presenter notes (3-5 sentences)..."
    }
  ]
}

Use element types: heading, text, bullet_list, numbered_list, callout, quote, divider, table, stat_box, timeline, two_column.
Slide titles must communicate insights, not generic labels.
Match the user's language.`;

export async function generatePresentationJson(prompt: string, maxSlides = 10): Promise<{
  deckTitle: string;
  slides: PresentationSlide[];
  tokens: number | null;
}> {
  const openai = getOpenAI();
  const r = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 12000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${PRESENTATION_SYSTEM}\n\nCreate at most ${maxSlides} slides.` },
      { role: "user", content: prompt },
    ],
  });
  const raw = r.choices[0]?.message?.content ?? '{"slides":[]}';
  let parsed: { title?: string; slides?: unknown[] } = {};
  try {
    parsed = JSON.parse(raw) as { title?: string; slides?: unknown[] };
  } catch {
    parsed = { slides: [] };
  }
  const deckTitle =
    typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim()
      : pickGenerationTitle(prompt);
  const slidesRaw = Array.isArray(parsed.slides) ? parsed.slides : [];
  const slides = slidesRaw.slice(0, maxSlides).map((s) => normalizePresentationSlide(s));
  return { deckTitle, slides, tokens: r.usage?.total_tokens ?? null };
}

export async function generateOutlineJson(topic: string): Promise<string> {
  const openai = getOpenAI();
  const r = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: "Return a clear presentation outline as markdown with numbered sections and bullet points. Match the user's language.",
      },
      { role: "user", content: `Create an outline for: ${topic}` },
    ],
  });
  return r.choices[0]?.message?.content ?? "";
}

export async function rewriteSlideJson(
  slide: PresentationSlide,
  instruction: string
): Promise<PresentationSlide> {
  const openai = getOpenAI();
  const r = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.6,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "Improve the slide JSON. Return ONLY { \"slide\": { title, elements, notes } }. Keep element types valid.",
      },
      {
        role: "user",
        content: `Instruction: ${instruction}\n\nSlide:\n${JSON.stringify(slide)}`,
      },
    ],
  });
  const raw = r.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as { slide?: unknown };
    if (parsed.slide) return normalizePresentationSlide(parsed.slide);
  } catch {
    /* fall through */
  }
  return slide;
}

export async function reviewDeckJson(
  title: string,
  slides: PresentationSlide[]
): Promise<string> {
  const openai = getOpenAI();
  const r = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "You are a presentation coach. Analyze logic flow, persuasiveness, and structure. Give actionable feedback in markdown.",
      },
      {
        role: "user",
        content: `Deck: ${title}\n\n${JSON.stringify(slides)}`,
      },
    ],
  });
  return r.choices[0]?.message?.content ?? "";
}
