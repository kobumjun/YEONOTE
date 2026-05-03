import { createBlock } from "@/lib/block-factory";
import type {
  AITemplatePayload,
  CalloutBlock,
  DatabaseTableBlock,
  HeadingBlock,
  ParagraphBlock,
  TemplateBlock,
  ToDoBlock,
  ToggleBlock,
} from "@/types/template";

function miniTable(title: string): DatabaseTableBlock {
  const b = createBlock("database_table") as DatabaseTableBlock;
  b.title = title;
  b.columns = [
    { name: "Item", type: "title" },
    { name: "Status", type: "select", options: ["Todo", "Done"] },
    { name: "Due", type: "date" },
    { name: "Notes", type: "text" },
    { name: "Priority", type: "select", options: ["Low", "Med", "High"] },
    { name: "Hours", type: "number" },
    { name: "Done", type: "checkbox" },
  ];
  b.rows = [{ Item: "", Status: "Todo", Due: "", Notes: "", Priority: "Med", Hours: "", Done: false }];
  return b;
}

/** Compact starter when OpenAI hits the 45s timeout (no credit charged for this path). */
export function buildTimeoutFallbackTemplate(userPrompt: string): AITemplatePayload {
  const preview = userPrompt.trim().slice(0, 240);

  const intro = createBlock("paragraph") as ParagraphBlock;
  intro.content = `AI generation timed out (45 second limit). Here is a compact starter you can edit and expand.\n\nYour request: ${preview || "(empty)"}\n\n📌 Duplicate this week's structure for weeks 2–4: copy the entire "Week 1" toggle (and its contents), paste it below, then rename toggles to Week 2, Week 3, and Week 4.`;

  const h1 = createBlock("heading1") as HeadingBlock;
  h1.content = "Weekly planner (starter)";

  const warn = createBlock("callout") as CalloutBlock;
  warn.icon = "⚠️";
  warn.content =
    "Try again with a shorter or simpler description, or build from this skeleton. Nested toggles and tables below are intentionally small so generation stays fast.";

  const overview = createBlock("toggle") as ToggleBlock;
  overview.title = "📊 Overview";
  const ovP = createBlock("paragraph") as ParagraphBlock;
  ovP.content = "";
  overview.children = [miniTable("Summary"), ovP];

  const week1 = createBlock("toggle") as ToggleBlock;
  week1.title = "📋 Week 1 — duplicate for weeks 2–4";
  const wnote = createBlock("paragraph") as ParagraphBlock;
  wnote.content =
    "Add one nested toggle per day (Mon–Sun). Each day: heading3 blocks for Morning / Afternoon / Evening, empty to_dos, and a notes paragraph.";
  const t1 = createBlock("to_do") as ToDoBlock;
  t1.content = "";
  const t2 = createBlock("to_do") as ToDoBlock;
  t2.content = "";
  const t3 = createBlock("to_do") as ToDoBlock;
  t3.content = "";
  week1.children = [wnote, t1, t2, t3, miniTable("Week tracker")];

  const blocks: TemplateBlock[] = [h1, intro, warn, overview, week1, miniTable("Archive / completed")];

  return {
    title: "Starter (AI timeout)",
    icon: "📄",
    cover: undefined,
    blocks: blocks as unknown[],
  };
}
