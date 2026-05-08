import type { CreationType } from "@/types/template";
import { getOpenAI } from "@/lib/openai";

const CLASSIFIER_SYSTEM = `Return exactly one lower-case word: document, presentation, image, or template.
Classify by user's requested output artifact.
- document: emails, essays, scripts, reports, plans, docs
- presentation: slides, deck, keynote, presentation outline
- image: poster, illustration, photo, logo, visual asset
- template: planner/tracker/dashboard/notion-style workspace structure`;

export async function classifyPrompt(prompt: string): Promise<CreationType> {
  const openai = getOpenAI();
  const r = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      { role: "system", content: CLASSIFIER_SYSTEM },
      { role: "user", content: prompt },
    ],
  });
  const out = r.choices[0]?.message?.content?.trim().toLowerCase();
  if (out === "document" || out === "presentation" || out === "image" || out === "template") return out;
  return "template";
}
