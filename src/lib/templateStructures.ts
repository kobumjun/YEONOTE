export type TemplateStructure = {
  id: number;
  name: string;
  instruction: string;
};

export const TEMPLATE_STRUCTURES: TemplateStructure[] = [
  {
    id: 1,
    name: "Dashboard + Single Table",
    instruction: `Structure: Start with H1 title + subtitle paragraph. Then 3 callout blocks in a row showing metrics (use columns block). Then a divider. Then ONE large database_table with 8+ columns. End with a paragraph for notes. Do NOT use any toggle blocks.`,
  },
  {
    id: 2,
    name: "Day Grid",
    instruction: `Structure: H1 title + subtitle. Then 7 heading3 blocks for each day (Monday-Sunday), each followed by 3-4 to_do blocks. NO toggle blocks, NO database tables. End with a divider and a callout with a tip.`,
  },
  {
    id: 3,
    name: "Deep Nested Toggles",
    instruction: `Structure: H1 title + subtitle. Then 4 toggle blocks. Each toggle contains 2 sub-toggles. Each sub-toggle contains either to_do items OR a small database_table with 5 columns. No content outside toggles except the title.`,
  },
  {
    id: 4,
    name: "Multi-Database Hub",
    instruction: `Structure: H1 title + subtitle. Then 3-4 heading2 sections. Each section has a brief paragraph description followed by a database_table. Each table must have COMPLETELY different columns and purposes. No toggles, no callouts.`,
  },
  {
    id: 5,
    name: "Minimal Focus",
    instruction: `Structure: H1 title only (no subtitle). One callout block with brief instructions. Then ONE database_table with 10+ columns, very detailed. Then one paragraph block for notes. Nothing else. Ultra minimal.`,
  },
  {
    id: 6,
    name: "Journal Entry",
    instruction: `Structure: H1 title + date. A callout showing today's focus. Then heading3 "Morning" with 3 to_do blocks. heading3 "Afternoon" with 3 to_do blocks. heading3 "Evening" with 3 to_do blocks. A divider. Then a database_table for "Entry Log" with date/mood/energy/notes columns. End with heading2 "Reflections" and empty paragraphs.`,
  },
  {
    id: 7,
    name: "Kanban Pipeline",
    instruction: `Structure: H1 title + subtitle. One large database_table as the main tracker with a "Status" column (📋 Backlog, 🔄 In Progress, 👀 Review, ✅ Done). Below it, a divider. Then heading2 "Archive" with another database_table for completed items with different columns. Then a quote block.`,
  },
  {
    id: 8,
    name: "Checklist Heavy",
    instruction: `Structure: H1 title + subtitle paragraph. Then 5-6 heading3 sections, each with a category name. Under each heading3, 4-6 to_do blocks. NO database tables, NO toggles. End with a callout summarizing completion tips.`,
  },
  {
    id: 9,
    name: "Wiki Reference",
    instruction: `Structure: H1 title. A callout with overview. Then 4-5 heading2 sections. Each section has 2-3 paragraphs of placeholder text "[Write your notes here]". Between some sections, add quote blocks with key definitions. End with a database_table as a reference index. No toggles.`,
  },
  {
    id: 10,
    name: "Phase Based",
    instruction: `Structure: H1 title + subtitle. heading2 "Phase 1: Planning" with to_do blocks. heading2 "Phase 2: Execution" with a database_table tracker. heading2 "Phase 3: Review" with paragraph blocks for reflection. heading2 "Phase 4: Archive" with another database_table. Each phase uses DIFFERENT block types.`,
  },
  {
    id: 11,
    name: "Metrics Dashboard",
    instruction: `Structure: H1 title. 4 callout blocks showing key numbers (use different icons: 📊📈🎯💰). A divider. heading2 with a database_table for detailed tracking. Another divider. heading2 with another database_table for historical data. No toggles, no to_do blocks.`,
  },
  {
    id: 12,
    name: "Morning Evening Split",
    instruction: `Structure: H1 title + subtitle. heading2 "🌅 Morning Routine" with 5 to_do blocks and a callout tip. A divider. heading2 "🌙 Evening Routine" with 5 to_do blocks and a callout tip. A divider. heading2 "📊 Weekly Tracker" with a database_table. End with a quote.`,
  },
  {
    id: 13,
    name: "Q&A Format",
    instruction: `Structure: H1 title. Then alternate between heading3 blocks (questions/prompts) and paragraph blocks (empty answer spaces). Create 8-10 question-answer pairs. End with a database_table summarizing key items. No toggles.`,
  },
  {
    id: 14,
    name: "Two Column Layout",
    instruction: `Structure: H1 title + subtitle. Use columns blocks to create side-by-side layouts. Left column: planning items (to_do blocks). Right column: tracking database_table. Below the columns: a full-width heading2 section with notes paragraphs.`,
  },
  {
    id: 15,
    name: "Priority Matrix",
    instruction: `Structure: H1 title + callout with instructions. heading2 "🔴 Urgent & Important" with to_do blocks. heading2 "🟡 Important, Not Urgent" with to_do blocks. heading2 "🔵 Urgent, Not Important" with to_do blocks. heading2 "⚪ Neither" with to_do blocks. End with a database_table for all items combined.`,
  },
  {
    id: 16,
    name: "Step by Step Guide",
    instruction: `Structure: H1 title + subtitle. Then numbered heading3 blocks: "Step 1:", "Step 2:", etc (6-8 steps). Each step has a paragraph description and 2-3 to_do sub-tasks. End with a callout "Completion Checklist" summary.`,
  },
  {
    id: 17,
    name: "Three Table Comparison",
    instruction: `Structure: H1 title + subtitle paragraph. Three heading2 sections, each with a database_table. Table 1: input/planning data. Table 2: execution/tracking data. Table 3: results/analysis data. Each table has completely different columns. Minimal other blocks.`,
  },
  {
    id: 18,
    name: "Timeline View",
    instruction: `Structure: H1 title. A database_table with date, milestone, description, status, owner columns. Below it, heading2 "Upcoming" with 3 callout blocks showing next 3 milestones. heading2 "Completed" with a second database_table for archived milestones. No toggles.`,
  },
  {
    id: 19,
    name: "Scorecard",
    instruction: `Structure: H1 title + subtitle. A callout showing overall score "[X/100]". Then 5 heading3 category sections. Each category has a brief paragraph and 3 to_do blocks representing criteria. End with a database_table summarizing scores per category with number columns.`,
  },
  {
    id: 20,
    name: "Brain Dump + Organize",
    instruction: `Structure: H1 title. heading2 "🧠 Brain Dump" with 8-10 empty paragraph blocks labeled "[idea 1]", "[idea 2]" etc. A divider. heading2 "📋 Organized" with a database_table for categorizing the ideas (columns: idea, category, priority, feasibility, next step). heading2 "🎯 Top 3 Actions" with 3 to_do blocks.`,
  },
];
