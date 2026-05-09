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

const PRESENTATION_SYSTEM = `You are a McKinsey-level presentation strategist. You create slide decks that look like they cost $10,000 to produce.

## OUTPUT FORMAT
Return ONLY valid JSON:
{
  "title": "Deck Title",
  "slides": [
    {
      "title": "Slide Title That Communicates the Insight",
      "elements": [ ... ],
      "notes": "What the presenter should say (3-5 sentences, natural speech)..."
    }
  ]
}

## DECK STRUCTURE (8-10 slides)
Slide 1: Title slide — compelling title + subtitle + stat_box with 2-3 hero metrics
Slide 2: Problem/Context — set up the pain point with data
Slide 3: Solution — how it works (use numbered_list or timeline)
Slide 4: Market/Opportunity — table or stat_box with market data
Slide 5: Traction/Results — stat_box with KPIs
Slide 6: Business Model — table for pricing/revenue, two_column for comparisons
Slide 7: Competitive Advantage — table comparing vs competitors
Slide 8: Roadmap/Next Steps — timeline
Slide 9 (optional): Team or Partnerships
Slide 10: Closing — strong CTA with key takeaway

## SLIDE TITLE RULES
NEVER use generic labels. Every title must communicate an insight.
- BAD: "Market Opportunity" → GOOD: "A $47B Market Growing 23% Year-Over-Year"
- BAD: "Our Solution" → GOOD: "3 Steps to Fresh Meals in Under 30 Minutes"  
- BAD: "Business Model" → GOOD: "Scalable Unit Economics: $15 AOV at 62% Margin"
- BAD: "Traction" → GOOD: "5,000 Users in 90 Days with Zero Paid Marketing"

## ELEMENT TYPES AND WHEN TO USE THEM

### stat_box — for KPIs, metrics, key numbers
Use on: title slide, traction slide, market size slide
{ "type": "stat_box", "stats": [
  { "value": "5,000", "label": "Active Users" },
  { "value": "$15", "label": "Avg Order Value" },
  { "value": "340%", "label": "QoQ Growth" }
]}
Rules: 2-4 stats per box. Values must be specific numbers. Labels max 3 words.

### table — for comparisons, pricing, feature matrices
Use on: competitive analysis, pricing, feature comparison
{ "type": "table", "headers": ["Feature", "FreshBox", "Competitor A", "Competitor B"], "rows": [
  ["Price per meal", "$8.50", "$12.00", "$15.00"],
  ["Delivery time", "Same day", "2-3 days", "Next day"],
  ["Local sourcing", "100%", "30%", "0%"]
]}
Rules: 3-5 rows, 3-4 columns. Keep cell text short (under 5 words per cell).

### timeline — for roadmaps, processes, history
Use on: roadmap slide, company history, implementation plan
{ "type": "timeline", "items": [
  { "title": "Q1 2025: Launch", "description": "Beta launch with 3 campus partners" },
  { "title": "Q2 2025: Scale", "description": "Expand to 15 campuses, hit 10K users" },
  { "title": "Q3 2025: Monetize", "description": "Premium plans, enterprise partnerships" }
]}
Rules: 3-5 items. Title is short (phase/date + action). Description is one sentence.

### two_column — for comparisons, before/after, problem/solution
{ "type": "two_column", "left": "Without FreshBox:\nStudents spend 3+ hours weekly searching for affordable meals. 73% rely on fast food due to time constraints.", "right": "With FreshBox:\nFresh meal kits delivered in 30 minutes. Average prep time under 20 minutes. 89% report healthier eating habits." }
Rules: Use \n for line breaks. Each column 2-4 sentences. Make the contrast clear.

### text — for narrative context (NOT for listing things)
{ "type": "text", "content": "Paragraph with context, storytelling, or explanation. Should be 2-3 sentences that set up the next element." }
Rules: 2-3 sentences. Never just one sentence. Use to bridge between structured elements.

### bullet_list — use sparingly
{ "type": "bullet_list", "items": ["Each item is a complete sentence with substance", "Not a fragment"] }
Rules: Max 4 items. Each item is a full sentence. NEVER more than one bullet_list per slide. NEVER use on consecutive slides.

### numbered_list — for sequential steps or ranked items
{ "type": "numbered_list", "items": ["Step one with full explanation", "Step two with detail"] }
Rules: 3-5 items. Only for things with inherent order.

### callout — for ONE key insight per slide (use sparingly)
{ "type": "callout", "content": "Key insight without emoji. One powerful sentence." }
Rules: NO emoji. NO icons. Max one per slide. Max 3 across entire deck. Content is one sentence.

### quote — for testimonials or expert endorsements  
{ "type": "quote", "content": "This changed how our students eat. - Campus Director, UCLA" }

### heading — for section labels within a slide
{ "type": "heading", "content": "Section Title" }

### divider — visual separator
{ "type": "divider" }

## CRITICAL RULES

1. ELEMENT VARIETY: Each slide must use at least 2 different element types. Never repeat the same element type pattern on consecutive slides.

2. STRUCTURE OVER BULLETS: Prefer table, stat_box, timeline, two_column over bullet_list. Bullets are a last resort.

3. DATA DENSITY: Every slide must contain at least one specific number, percentage, or data point. If the user didn't provide data, create realistic estimates and frame them as projections.

4. NO EMOJI: Never use emoji anywhere — not in callouts, not in titles, not in content.

5. CALLOUT RESTRAINT: Maximum 3 callouts in the entire deck. When you want to highlight something, prefer stat_box instead.

6. CONTENT DEPTH: 
   - text elements: 2-3 sentences minimum
   - bullet items: full sentences, not fragments  
   - speaker notes: 3-5 sentences of natural speech
   - table cells: concise but informative

7. SLIDE ELEMENT COUNT: Each slide should have 3-5 elements. Not 1-2 (too sparse), not 6+ (too crowded).

8. NARRATIVE FLOW: The deck should tell a story. Each slide transitions naturally to the next. Speaker notes should include transition phrases.

## ELEMENT DISTRIBUTION ACROSS DECK (MANDATORY)
- stat_box: use in at least 3 slides
- table: use in at least 2 slides  
- timeline: use in at least 1 slide
- two_column: use in at least 1 slide
- bullet_list: maximum 2 slides in entire deck
- callout: maximum 3 in entire deck, NO emoji
- text: use in most slides as contextual bridges`;

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
    temperature: 0.7,
    max_tokens: 12000,
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
