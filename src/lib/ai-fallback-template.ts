import { createBlock } from "@/lib/block-factory";
import type {
  AITemplatePayload,
  BulletedListBlock,
  CalloutBlock,
  ChecklistBlock,
  DatabaseColumn,
  DatabaseTableBlock,
  HeadingBlock,
  MonthlyCalendarBlock,
  ParagraphBlock,
  SubPageBlock,
  TemplateBlock,
  ToggleBlock,
} from "@/types/template";
import { padDatabaseRowsToMin } from "@/types/template";

function tableBlock(title: string, columns: DatabaseColumn[]): DatabaseTableBlock {
  const b = createBlock("database_table") as DatabaseTableBlock;
  b.title = title;
  b.columns = columns;
  b.rows = padDatabaseRowsToMin(columns, []);
  return b;
}

function detailSubPage(id: string, title: string): SubPageBlock {
  const b = createBlock("sub_page") as SubPageBlock;
  b.id = id;
  b.title = title;
  b.icon = "📂";
  const intro = createBlock("paragraph") as ParagraphBlock;
  intro.content = "";
  const log = tableBlock("Detail Log", [
    { name: "Date", type: "date" },
    { name: "Item", type: "title" },
    { name: "Notes", type: "text" },
    { name: "Status", type: "select", options: ["Planned", "In Progress", "Completed", "On Hold"] },
    { name: "Duration (min)", type: "number" },
  ]);
  b.children = [intro, log];
  return b;
}

/** Starter when generation hits the timeout (no credit charged for this path). */
export function buildTimeoutFallbackTemplate(userPrompt: string): AITemplatePayload {
  const preview = userPrompt.trim().slice(0, 240);
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const h1 = createBlock("heading1") as HeadingBlock;
  h1.content = "Routine · Log (timeout fallback)";

  const guide = createBlock("callout") as CalloutBlock;
  guide.icon = "📌";
  guide.content =
    "Open a date from the calendar to record daily activity. Use the main page for goals and overview. Table cells are intentionally empty for manual input.";

  const intro = createBlock("paragraph") as ParagraphBlock;
  intro.content = `Generation timed out. Here is a minimal linked starter structure. Request: ${preview || "(none)"}`;

  const hGoals = createBlock("heading2") as HeadingBlock;
  hGoals.content = "🎯 Goals";
  const goalsTable = tableBlock("Goals", [
    { name: "Goals", type: "title" },
    { name: "Goal Value", type: "text" },
    { name: "Due Date", type: "date" },
    { name: "Done", type: "checkbox" },
    { name: "Notes", type: "text" },
  ]);

  const hCal = createBlock("heading2") as HeadingBlock;
  hCal.content = "📅 This Month Calendar";
  const cal = createBlock("monthly_calendar") as MonthlyCalendarBlock;
  cal.title = "Monthly Routine Calendar";
  cal.year = y;
  cal.month = m + 1;
  cal.days = {};
  cal.dayDetailTemplate = {
    blocks: [
      {
        id: crypto.randomUUID(),
        type: "callout",
        icon: "🗓️",
        content: "Record your progress for today below.",
      },
      {
        id: crypto.randomUUID(),
        type: "checklist",
        items: [
          { content: "Core task completed", checked: false },
          { content: "Log updated", checked: false },
          { content: "Review written", checked: false },
        ],
      },
      tableBlock("Daily Log", [
        { name: "Item", type: "title" },
        { name: "Category", type: "select", options: ["Not Started", "In Progress", "Completed", "On Hold"] },
        { name: "Duration (min)", type: "number" },
        { name: "Notes", type: "text" },
        { name: "Status", type: "select", options: ["Normal", "Needs attention", "Needs improvement"] },
      ]),
      {
        id: crypto.randomUUID(),
        type: "toggle",
        title: "Today's Notes",
        children: [{ id: crypto.randomUUID(), type: "paragraph", content: "" }],
      },
    ],
  };

  const hMaster = createBlock("heading2") as HeadingBlock;
  hMaster.content = "🏋️ Master List (row-link example)";
  const master = tableBlock("Master", [
    { name: "Name", type: "title" },
    { name: "Category", type: "select", options: ["A", "B", "C", "D"] },
    { name: "Target sessions/week", type: "number" },
    { name: "Last Date", type: "date" },
    { name: "Notes", type: "text" },
  ]);
  master.rows[0].linkedSectionId = "detail-slot-1";
  master.rows[1].linkedSectionId = "detail-slot-2";
  master.rows[2].linkedSectionId = "detail-slot-3";

  const sp1 = detailSubPage("detail-slot-1", "Detail 1");
  const sp2 = detailSubPage("detail-slot-2", "Detail 2");
  const sp3 = detailSubPage("detail-slot-3", "Detail 3");

  const hHyd = createBlock("heading2") as HeadingBlock;
  hHyd.content = "💧 Hydration · Supplements";
  const hyd = createBlock("checklist") as ChecklistBlock;
  hyd.items = [
    { content: "Water 500ml — after waking", checked: false },
    { content: "Water 500ml — morning", checked: false },
    { content: "Water 500ml — after lunch", checked: false },
    { content: "Water 500ml — pre-workout", checked: false },
    { content: "Water 500ml — post-workout", checked: false },
    { content: "Water 500ml — evening", checked: false },
    { content: "Protein", checked: false },
    { content: "Vitamins", checked: false },
    { content: "Creatine", checked: false },
  ];

  const hRev = createBlock("heading2") as HeadingBlock;
  hRev.content = "📊 Weekly review";
  const revToggle = createBlock("toggle") as ToggleBlock;
  revToggle.title = "▶ This Week Review";
  const revBullets = createBlock("bulleted_list") as BulletedListBlock;
  revBullets.items = ["", "", ""];
  revToggle.children = [revBullets];

  const warn = createBlock("callout") as CalloutBlock;
  warn.icon = "⚠️";
  warn.content = "Try regenerating when your network is stable.";

  const blocks: TemplateBlock[] = [
    h1,
    guide,
    intro,
    hGoals,
    goalsTable,
    hCal,
    cal,
    hMaster,
    master,
    sp1,
    sp2,
    sp3,
    hHyd,
    hyd,
    hRev,
    revToggle,
    warn,
  ];

  return {
    title: "Starter (timeout)",
    icon: "📄",
    cover: undefined,
    blocks: blocks as unknown[],
  };
}
