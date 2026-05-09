import { getOpenAI } from "@/lib/openai";
import type { PresentationSlide } from "@/types/template";
import { normalizePresentationSlide } from "@/types/template";

export function pickGenerationTitle(prompt: string): string {
  return prompt.slice(0, 80).trim() || "Untitled";
}

const DOCUMENT_SYSTEM = `You are a professional writer. Generate the requested document as clean, well-structured prose.

LANGUAGE
- Match the user's language for all visible text.

RULES (strict)
- Use ONLY these block types: "heading", "paragraph".
- Do NOT use: callout, quote, divider, bulleted_list, numbered_list, toggle, code, columns, tables, or any other block type.
- Write in natural, flowing prose paragraphs.
- Use "heading" blocks only for major section titles (not every sentence).
- The document should read like a professionally written letter, email, essay, or report — not like an AI template.
- No decorative elements, no tip boxes, no highlighted sections, no ornamental dividers.
- Keep formatting minimal and clean.
- Match tone to the request (formal for business, casual for personal, etc.).

OUTPUT
- Return ONLY valid JSON with a single key "blocks" whose value is an array.
- Each block: { "type": "heading", "level": 1 | 2 | 3, "text": "..." } OR { "type": "paragraph", "text": "..." }.
- Nothing else. No markdown outside JSON.

Example shape:
{"blocks":[
  { "type": "heading", "level": 1, "text": "Document Title" },
  { "type": "paragraph", "text": "First paragraph of natural prose..." },
  { "type": "paragraph", "text": "Second paragraph..." },
  { "type": "heading", "level": 2, "text": "Section Title" },
  { "type": "paragraph", "text": "Section content..." }
]}`;

function sanitizeDocumentBlocks(blocks: unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const raw of blocks) {
    if (!raw || typeof raw !== "object") continue;
    const b = raw as { type?: string; level?: unknown; text?: unknown; content?: unknown };
    const t = b.type;
    if (t === "heading") {
      const level = typeof b.level === "number" && b.level >= 1 && b.level <= 3 ? b.level : 2;
      const text =
        typeof b.text === "string"
          ? b.text
          : typeof b.content === "string"
            ? b.content
            : "";
      if (!text.trim()) continue;
      out.push({ type: "heading", level, text });
    } else if (t === "paragraph") {
      const text = typeof b.text === "string" ? b.text : typeof b.content === "string" ? b.content : "";
      if (!text.trim()) continue;
      out.push({ type: "paragraph", text });
    }
  }
  return out;
}

const PRESENTATION_SYSTEM = `You are an elite presentation strategist and content designer.
Generate a compelling, investor-grade slide deck as JSON.

## SLIDE STRUCTURE RULES:
- Generate 7-10 slides (quality over quantity)
- First slide: title slide with a compelling subtitle (one-liner value proposition, not generic description)
- Last slide: strong closing with call-to-action or key takeaway
- Every slide MUST have detailed speaker notes (3-5 sentences)

## CONTENT QUALITY RULES:
- Lead every slide with ONE key message. The title should communicate the insight, not just label the topic.
  BAD title: "Market Opportunity"
  GOOD title: "A $47B Market Growing 23% YoY"
- Use specific numbers, percentages, and data points. Invent realistic ones if the user doesn't provide them.
- Each slide should tell part of a story. The deck should flow as a narrative, not a list of topics.
- Write content as if presenting to executives who have 10 minutes and zero patience for fluff.

## ELEMENT USAGE RULES (CRITICAL - you must vary element types):
- NEVER use more than one bullet_list per slide
- NEVER have two consecutive slides that both start with bullet_list
- Each slide must use 2-4 elements from DIFFERENT types
- Use this distribution across the whole deck:
  - callout: use in at least 3 slides (key stats, metrics, quotes from customers)
  - quote: use in at least 1 slide (testimonial, expert quote, or powerful statement)
  - numbered_list: use for processes, steps, or rankings (not for generic points)
  - text: use for narrative paragraphs that set context
  - heading: use for section breaks or emphasis within a slide
  - bullet_list: maximum 4 items per list, each item must be a complete sentence with substance
  - divider: use to separate sections within a slide

## CALLOUT BEST PRACTICES:
- Always include an icon emoji that matches the content
- Use for: key metrics ("📈 Revenue grew 340% in 12 months"), warnings ("⚠️ 73% of students report housing search as their #1 stress factor"), highlights ("💡 Our algorithm matches students 3x faster than manual search")
- Keep callout content to 1-2 impactful sentences max

## SLIDE CONTENT PATTERNS (use these as templates):

Title Slide:
  elements: [text (subtitle), callout (key metric or achievement)]

Problem Slide:
  elements: [text (context paragraph), callout (pain point stat), bullet_list (specific problems, max 3-4)]

Solution Slide:
  elements: [text (overview), numbered_list (how it works, 3 steps), callout (key differentiator)]

Market/Opportunity Slide:
  elements: [callout (market size stat), bullet_list (growth drivers), callout (target segment)]

Traction/Results Slide:
  elements: [callout (headline metric), callout (second metric), text (narrative context)]

Business Model Slide:
  elements: [text (model description), numbered_list (revenue streams), callout (unit economics)]

Closing Slide:
  elements: [heading (key takeaway), text (closing narrative), callout (CTA)]

Return ONLY valid JSON:
{
  "title": "Presentation Title",
  "slides": [
    {
      "title": "Insight-Driven Slide Title",
      "elements": [
        { "type": "text", "content": "Contextual narrative paragraph..." },
        { "type": "callout", "content": "📊 Key statistic or insight", "icon": "📊" },
        { "type": "bullet_list", "items": ["Substantive point with detail", "Another meaningful point"] }
      ],
      "notes": "Detailed speaker notes: what to say, what to emphasize, transition to next slide..."
    }
  ]
}`;

export async function generateDocumentBlocksJson(prompt: string): Promise<{ blocks: unknown[]; tokens: number | null }> {
  const openai = getOpenAI();
  const r = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 8000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: DOCUMENT_SYSTEM },
      { role: "user", content: prompt },
    ],
  });
  const raw = r.choices[0]?.message?.content ?? '{"blocks":[]}';
  let parsed: { blocks?: unknown[] } = {};
  try {
    parsed = JSON.parse(raw) as { blocks?: unknown[] };
  } catch {
    parsed = { blocks: [] };
  }
  const rawBlocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
  return {
    blocks: sanitizeDocumentBlocks(rawBlocks),
    tokens: r.usage?.total_tokens ?? null,
  };
}

export async function generatePresentationJson(prompt: string): Promise<{
  deckTitle: string;
  slides: PresentationSlide[];
  tokens: number | null;
}> {
  const openai = getOpenAI();
  const r = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.6,
    max_tokens: 6000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: PRESENTATION_SYSTEM },
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
  const slides = slidesRaw.map((s) => normalizePresentationSlide(s));
  return { deckTitle, slides, tokens: r.usage?.total_tokens ?? null };
}

export async function generateImageUrl(prompt: string): Promise<{ imageUrl: string; tokens: number | null }> {
  const openai = getOpenAI();
  const r = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    size: "1024x1024",
    quality: "standard",
    n: 1,
  });
  return { imageUrl: r.data?.[0]?.url ?? "", tokens: null };
}
