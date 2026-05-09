export type BlockId = string;
export type CreationType = "document" | "presentation" | "image" | "template";

export type TemplateStyle = "minimal" | "colorful" | "corporate" | "playful";

export type DatabaseColumnType =
  | "title"
  | "text"
  | "number"
  | "select"
  | "date"
  | "person"
  | "checkbox";

export type DatabaseColumn = {
  name: string;
  type: DatabaseColumnType;
  options?: string[];
};

/** Row cells + optional jump target for master→detail navigation (same template). */
export type DatabaseRow = Record<string, string | number | boolean | null | undefined> & {
  linkedSectionId?: string;
};

const DATABASE_COLUMN_TYPES: DatabaseColumnType[] = [
  "title",
  "text",
  "number",
  "select",
  "date",
  "person",
  "checkbox",
];

export const DEFAULT_SELECT_OPTIONS: string[] = [
  "📋 Not Started",
  "🔄 In Progress",
  "👀 Under Review",
  "✅ Completed",
  "⏸ On Hold",
];

/** Options for select columns when missing or empty (AI JSON or legacy data). */
export function getSelectColumnOptions(col: DatabaseColumn): string[] {
  if (col.type !== "select") return [];
  const o = col.options;
  if (Array.isArray(o) && o.length > 0) return o;
  return [...DEFAULT_SELECT_OPTIONS];
}

/** Ensures select columns always have options (fixes empty AI dropdowns). */
export function coerceDatabaseColumn(col: Record<string, unknown>): DatabaseColumn {
  const name = (String(col.name ?? "Entry").trim() || "Entry") as string;
  const raw = String(col.type ?? "text").toLowerCase();
  const type = (DATABASE_COLUMN_TYPES.includes(raw as DatabaseColumnType)
    ? raw
    : "text") as DatabaseColumnType;

  if (type === "select") {
    const optsRaw = Array.isArray(col.options)
      ? (col.options as unknown[]).map((x) => String(x).trim()).filter(Boolean)
      : [];
    const options =
      optsRaw.length >= 4 ? optsRaw : [...DEFAULT_SELECT_OPTIONS];
    return { name, type: "select", options };
  }

  const options = Array.isArray(col.options)
    ? (col.options as unknown[]).map((x) => String(x)).filter(Boolean)
    : undefined;
  return { name, type, ...(options?.length ? { options } : {}) };
}

export function coerceDatabaseColumns(raw: unknown): DatabaseColumn[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[]).map((c) => coerceDatabaseColumn(c));
}

/** AI templates: enough blank rows for logging (user fills in; no sample entity names). */
const MIN_AI_DATABASE_ROWS = 10;

/** Safe id for block anchors / row links (AI slugs or UUID fragments). */
export function sanitizeBlockIdFromAi(raw: string): string {
  const t = raw
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return t.slice(0, 128) || newBlockId();
}

function pickBlockId(raw: Record<string, unknown>, explicit?: BlockId): BlockId {
  const fromRaw = raw.id;
  if (typeof fromRaw === "string" && fromRaw.trim() !== "") {
    return sanitizeBlockIdFromAi(fromRaw.trim());
  }
  return explicit ?? newBlockId();
}

function extractRowLinkId(rec: Record<string, unknown>): string | undefined {
  const linkRaw =
    rec.linkedSectionId ?? rec.linked_section_id ?? rec.targetBlockId ?? rec.target_block_id;
  if (typeof linkRaw !== "string" || !linkRaw.trim()) return undefined;
  return sanitizeBlockIdFromAi(linkRaw.trim());
}

/** Cell value in a leaked "detail link" column → slug for linkedSectionId (never invent UUID). */
export function migrateLeakyCellToLinkedSectionId(val: unknown): string | undefined {
  const s = String(val ?? "").trim();
  if (!s) return undefined;
  const cleaned = s.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  if (cleaned.length < 3) return undefined;
  return cleaned;
}

/** Column titles that must never appear as user-visible DB columns (detail routing only). */
export function isHiddenMetaDatabaseColumnName(name: string): boolean {
  const compact = name.trim().toLowerCase().replace(/\s+/g, "");
  if (compact === "linkedsectionid" || compact === "targetblockid") return true;
  if (compact.includes("linkedsection")) return true;
  if (compact.includes("targetblock")) return true;
  if (compact.includes("세부page")) return true;
  if (compact.includes("subpage") || compact.includes("sub_page")) return true;
  if (compact.includes("detailpage") || compact.includes("detaillink")) return true;
  return false;
}

/** Removes leaked meta columns and promotes their cell values to row.linkedSectionId when needed. */
export function stripMetaLinkColumnsFromDatabaseTable(
  columns: DatabaseColumn[],
  rows: DatabaseRow[]
): { columns: DatabaseColumn[]; rows: DatabaseRow[] } {
  const removeNames = columns.filter((c) => isHiddenMetaDatabaseColumnName(c.name)).map((c) => c.name);
  if (removeNames.length === 0) return { columns, rows };

  const keepCols = columns.filter((c) => !removeNames.includes(c.name));
  const newRows = rows.map((row) => {
    const next: DatabaseRow = { ...row };
    let link = next.linkedSectionId?.trim();
    for (const name of removeNames) {
      const migrated = migrateLeakyCellToLinkedSectionId(next[name]);
      if (!link && migrated) link = migrated;
      delete next[name];
    }
    if (link) next.linkedSectionId = sanitizeBlockIdFromAi(link);
    else delete next.linkedSectionId;
    return next;
  });

  return { columns: keepCols, rows: newRows };
}

/** Row link for UI: explicit linkedSectionId or fallback from leaked columns still present in legacy data. */
export function getEffectiveLinkedSectionId(row: DatabaseRow, columns: DatabaseColumn[]): string | undefined {
  const direct = row.linkedSectionId?.trim();
  if (direct) return direct;
  for (const c of columns) {
    if (!isHiddenMetaDatabaseColumnName(c.name)) continue;
    const m = migrateLeakyCellToLinkedSectionId(row[c.name]);
    if (m) return sanitizeBlockIdFromAi(m);
  }
  return undefined;
}

/** Normalizes one DB row from AI/JSON; supports row objects, { cells, linkedSectionId }, or plain arrays aligned to columns. */
export function normalizeDatabaseRowFromAi(raw: unknown, columns: DatabaseColumn[]): DatabaseRow {
  let linkFromMeta: string | undefined;
  const valuesByColName: Record<string, unknown> = {};

  if (Array.isArray(raw)) {
    columns.forEach((c, i) => {
      if (i < raw.length && raw[i] !== undefined && raw[i] !== null) valuesByColName[c.name] = raw[i];
    });
  } else if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    linkFromMeta = extractRowLinkId(o);
    if (Array.isArray(o.cells)) {
      const cells = o.cells as unknown[];
      columns.forEach((c, i) => {
        if (i < cells.length && cells[i] !== undefined && cells[i] !== null) valuesByColName[c.name] = cells[i];
      });
    }
    for (const c of columns) {
      if (Object.prototype.hasOwnProperty.call(o, c.name)) {
        valuesByColName[c.name] = o[c.name];
      }
    }
  }

  const row: DatabaseRow = {};
  for (const c of columns) {
    const v = valuesByColName[c.name];
    if (c.type === "checkbox") row[c.name] = Boolean(v);
    else if (c.type === "number")
      row[c.name] = v === "" || v === undefined || v === null ? null : Number(v);
    else if (c.type === "date") row[c.name] = typeof v === "string" ? v : "";
    else row[c.name] = v == null ? "" : String(v);
  }
  if (linkFromMeta) row.linkedSectionId = sanitizeBlockIdFromAi(linkFromMeta.trim());
  return row;
}

export function normalizeDatabaseRowsFromAi(raw: unknown, columns: DatabaseColumn[]): DatabaseRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => normalizeDatabaseRowFromAi(r, columns));
}

/** Ensures AI/imported tables have enough blank starter rows (no prefilled sample data). */
export function padDatabaseRowsToMin(columns: DatabaseColumn[], rows: DatabaseRow[]): DatabaseRow[] {
  if (columns.length === 0) return rows;
  const out = [...rows];
  const makeRow = (): DatabaseRow => {
    const r: DatabaseRow = {};
    for (const c of columns) {
      if (c.type === "checkbox") r[c.name] = false;
      else if (c.type === "number") r[c.name] = null;
      else if (c.type === "date") r[c.name] = "";
      else r[c.name] = "";
    }
    return r;
  };
  while (out.length < MIN_AI_DATABASE_ROWS) out.push(makeRow());
  return out;
}

export function collectTemplateBlockIds(blocks: TemplateBlock[]): Set<string> {
  const s = new Set<string>();
  const walk = (b: TemplateBlock) => {
    s.add(b.id);
    if (b.type === "toggle" || b.type === "sub_page" || b.type === "linked_page") {
      b.children.forEach(walk);
    }
    if (b.type === "columns") {
      b.children.forEach((col) => col.forEach(walk));
    }
  };
  blocks.forEach(walk);
  return s;
}

function fixBlockLinkedRows(b: TemplateBlock, validIds: Set<string>): TemplateBlock {
  if (
    b.type === "database_table" ||
    b.type === "database_board" ||
    b.type === "database_calendar" ||
    b.type === "database_gallery"
  ) {
    return {
      ...b,
      rows: b.rows.map((r) => {
        const lid = r.linkedSectionId;
        if (lid && !validIds.has(lid)) {
          const next = { ...r };
          delete next.linkedSectionId;
          return next;
        }
        return r;
      }),
    } as TemplateBlock;
  }
  if (b.type === "toggle" || b.type === "sub_page" || b.type === "linked_page") {
    return { ...b, children: b.children.map((c) => fixBlockLinkedRows(c, validIds)) };
  }
  if (b.type === "columns") {
    return {
      ...b,
      children: b.children.map((col) => col.map((c) => fixBlockLinkedRows(c, validIds))),
    };
  }
  return b;
}

export function stripInvalidLinkedSectionIds(blocks: TemplateBlock[]): TemplateBlock[] {
  const valid = collectTemplateBlockIds(blocks);
  return blocks.map((b) => fixBlockLinkedRows(b, valid));
}

type BlockBase = { id: BlockId };

export type HeadingBlock = BlockBase & {
  type: "heading1" | "heading2" | "heading3";
  content: string;
};

export type ParagraphBlock = BlockBase & {
  type: "paragraph";
  content: string;
};

export type BulletedListBlock = BlockBase & {
  type: "bulleted_list";
  items: string[];
};

export type NumberedListBlock = BlockBase & {
  type: "numbered_list";
  items: string[];
};

export type ToDoBlock = BlockBase & {
  type: "to_do";
  content: string;
  checked: boolean;
};

export type ChecklistItem = {
  content: string;
  checked: boolean;
  detailTemplate?: DatabaseTableDetailTemplate;
};

/** Multi-item checkbox list (e.g. weekly habits). Distinct from single-line to_do. */
export type ChecklistBlock = BlockBase & {
  type: "checklist";
  items: ChecklistItem[];
};

export type ToggleBlock = BlockBase & {
  type: "toggle";
  title: string;
  children: TemplateBlock[];
};

/** Notion-style sub-page: expandable detail area (hierarchical depth). */
export type SubPageBlock = BlockBase & {
  type: "sub_page";
  title: string;
  icon?: string;
  children: TemplateBlock[];
};

/** Linked detail hub: optional external URL + nested blocks (use when a row/item has a “detail page”). */
export type LinkedPageBlock = BlockBase & {
  type: "linked_page";
  title: string;
  icon?: string;
  description?: string;
  url?: string;
  children: TemplateBlock[];
};

export type CalloutBlock = BlockBase & {
  type: "callout";
  icon: string;
  content: string;
};

export type QuoteBlock = BlockBase & {
  type: "quote";
  content: string;
};

export type DividerBlock = BlockBase & {
  type: "divider";
};

export type CodeBlock = BlockBase & {
  type: "code";
  language: string;
  content: string;
};

export type ImageBlock = BlockBase & {
  type: "image";
  src?: string;
  alt?: string;
  caption?: string;
};

export type BookmarkBlock = BlockBase & {
  type: "bookmark";
  url: string;
  title?: string;
  description?: string;
};

/** Shared per-row detail layout for database_table (cloned on open; saves tokens vs per-row linked blocks). */
export type DatabaseTableDetailTemplate = {
  blocks: TemplateBlock[];
};

export type DatabaseTableBlock = BlockBase & {
  type: "database_table";
  title: string;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
  detailTemplate?: DatabaseTableDetailTemplate;
};

export type DatabaseBoardBlock = BlockBase & {
  type: "database_board";
  title: string;
  groupBy: string;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
};

export type DatabaseCalendarBlock = BlockBase & {
  type: "database_calendar";
  title: string;
  dateColumn: string;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
};

export type DatabaseGalleryBlock = BlockBase & {
  type: "database_gallery";
  title: string;
  imageColumn: string;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
};

export type MonthlyCalendarDayState = {
  checked: boolean;
  hasContent: boolean;
};

export type MonthlyCalendarBlock = BlockBase & {
  type: "monthly_calendar";
  title: string;
  year: number;
  month: number;
  days: Record<string, MonthlyCalendarDayState>;
  dayDetailTemplate?: DatabaseTableDetailTemplate;
};

export type ColumnsBlock = BlockBase & {
  type: "columns";
  layout: "2" | "3";
  children: TemplateBlock[][];
};

export type EmbedBlock = BlockBase & {
  type: "embed";
  src: string;
  title?: string;
};

export type TemplateBlock =
  | HeadingBlock
  | ParagraphBlock
  | BulletedListBlock
  | NumberedListBlock
  | ToDoBlock
  | ChecklistBlock
  | ToggleBlock
  | SubPageBlock
  | LinkedPageBlock
  | CalloutBlock
  | QuoteBlock
  | DividerBlock
  | CodeBlock
  | ImageBlock
  | BookmarkBlock
  | DatabaseTableBlock
  | DatabaseBoardBlock
  | DatabaseCalendarBlock
  | DatabaseGalleryBlock
  | MonthlyCalendarBlock
  | ColumnsBlock
  | EmbedBlock;

export type TemplateContent = {
  blocks: TemplateBlock[];
};

export type DocumentContent = {
  /** Legacy HTML-only documents (migrated to blocks in the editor). */
  html?: string;
  blocks?: TemplateBlock[];
};

export type SlideElement =
  | { type: "bullet_list"; items: string[] }
  | { type: "text"; content: string }
  | { type: "heading"; content: string }
  | { type: "image"; url: string; alt: string }
  | { type: "callout"; content: string; icon?: string }
  | { type: "divider" }
  | { type: "quote"; content: string }
  | { type: "numbered_list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "stat_box"; stats: { value: string; label: string }[] }
  | { type: "timeline"; items: { title: string; description: string }[] }
  | { type: "two_column"; left: string; right: string };

export type PresentationSlide = {
  title: string;
  elements: SlideElement[];
  notes?: string;
  /** @deprecated Generated by older prompts; converted to `elements` when loaded. */
  bullets?: string[];
};

export type PresentationContent = {
  title: string;
  slides: PresentationSlide[];
};

function coerceStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x ?? "").trim()).filter((s) => s.length > 0);
}

export function normalizeSlideElement(raw: unknown): SlideElement | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const type = String(o.type ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  switch (type) {
    case "bullet_list":
    case "bulleted_list":
      return { type: "bullet_list", items: coerceStringList(o.items) };
    case "numbered_list":
      return { type: "numbered_list", items: coerceStringList(o.items) };
    case "text":
      return { type: "text", content: String(o.content ?? "").trim() };
    case "heading":
      return { type: "heading", content: String(o.content ?? o.text ?? "").trim() };
    case "image":
      return {
        type: "image",
        url: String(o.url ?? ""),
        alt: String(o.alt ?? o.caption ?? ""),
      };
    case "callout":
      return {
        type: "callout",
        content: String(o.content ?? "").trim(),
        ...(typeof o.icon === "string" && o.icon.trim() ? { icon: o.icon.trim() } : {}),
      };
    case "divider":
      return { type: "divider" };
    case "quote":
      return { type: "quote", content: String(o.content ?? "").trim() };
    case "table": {
      const headers = Array.isArray(o.headers) ? o.headers.map((h) => String(h ?? "").trim()) : [];
      const rows = Array.isArray(o.rows)
        ? o.rows.map((r) =>
            Array.isArray(r) ? r.map((cell) => String(cell ?? "").trim()) : []
          )
        : [];
      return { type: "table", headers, rows };
    }
    case "stat_box": {
      const stats = Array.isArray(o.stats)
        ? o.stats.map((s) => {
            const rec = (s ?? {}) as Record<string, unknown>;
            return {
              value: String(rec.value ?? "").trim(),
              label: String(rec.label ?? "").trim(),
            };
          })
        : [];
      return { type: "stat_box", stats };
    }
    case "timeline": {
      const items = Array.isArray(o.items)
        ? o.items.map((it) => {
            const rec = (it ?? {}) as Record<string, unknown>;
            return {
              title: String(rec.title ?? "").trim(),
              description: String(rec.description ?? "").trim(),
            };
          })
        : [];
      return { type: "timeline", items };
    }
    case "two_column":
      return {
        type: "two_column",
        left: String(o.left ?? "").trim(),
        right: String(o.right ?? "").trim(),
      };
    default:
      return null;
  }
}

export function normalizePresentationSlide(raw: unknown): PresentationSlide {
  if (!raw || typeof raw !== "object") {
    return { title: "Slide", elements: [] };
  }
  const o = raw as Record<string, unknown>;
  const title = String(o.title ?? "Slide").trim() || "Slide";
  const notesRaw = o.notes;
  const notes = notesRaw != null && String(notesRaw).trim() ? String(notesRaw) : undefined;
  const elements: SlideElement[] = [];
  if (Array.isArray(o.elements)) {
    for (const el of o.elements) {
      const n = normalizeSlideElement(el);
      if (n) elements.push(n);
    }
  }
  const bullets = Array.isArray(o.bullets) ? o.bullets.map((b) => String(b ?? "").trim()) : undefined;
  if (elements.length === 0 && bullets && bullets.some((b) => b.length > 0)) {
    elements.push({ type: "bullet_list", items: bullets.filter((b) => b.length > 0) });
  }
  return { title, elements, notes, bullets };
}

export function normalizePresentationSlides(raw: unknown): PresentationSlide[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizePresentationSlide);
}

export function slideElementToPlainText(el: SlideElement): string {
  switch (el.type) {
    case "bullet_list":
    case "numbered_list":
      return el.items.join("\n");
    case "text":
    case "heading":
    case "callout":
    case "quote":
      return el.content;
    case "image":
      return el.alt || el.url;
    case "divider":
      return "—";
    case "table":
      return [el.headers.join(" | "), ...el.rows.map((r) => r.join(" | "))].join("\n");
    case "stat_box":
      return el.stats.map((s) => `${s.value} ${s.label}`.trim()).join(" · ");
    case "timeline":
      return el.items.map((it) => `${it.title}: ${it.description}`.trim()).join("\n");
    case "two_column":
      return `${el.left}\n${el.right}`.trim();
    default:
      return "";
  }
}

export function presentationToPlainText(slides: PresentationSlide[]): string {
  return slides
    .map((s, i) => {
      const body = (s.elements ?? []).map(slideElementToPlainText).filter(Boolean).join("\n");
      const notes = s.notes?.trim() ? `\nNotes: ${s.notes.trim()}` : "";
      return `${i + 1}. ${s.title}\n${body}${notes}`;
    })
    .join("\n\n");
}

export type ImageContent = {
  imageUrl: string;
  prompt?: string;
};

export type CreationContent = TemplateContent | DocumentContent | PresentationContent | ImageContent;

export function isTemplateContent(content: unknown): content is TemplateContent {
  return Boolean(content && typeof content === "object" && Array.isArray((content as { blocks?: unknown[] }).blocks));
}

export function asTemplateContent(content: unknown): TemplateContent {
  if (isTemplateContent(content)) return content;
  return { blocks: [] };
}

export type AITemplatePayload = {
  title: string;
  icon?: string;
  cover?: string;
  blocks: unknown[];
};

export type AIGeneratePayload =
  | (AITemplatePayload & { creationType: "template" })
  | {
      creationType: "document";
      title: string;
      icon?: string;
      cover?: string;
      blocks: unknown[];
    }
  | {
      creationType: "presentation";
      title: string;
      icon?: string;
      cover?: string;
      slides: PresentationSlide[];
    }
  | {
      creationType: "image";
      title: string;
      icon?: string;
      cover?: string;
      imageUrl: string;
    };

function coerceText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((v) => coerceText(v))
      .filter(Boolean)
      .join("\n");
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const candidates = [obj.text, obj.value, obj.content, obj.plain_text];
    for (const candidate of candidates) {
      const t = coerceText(candidate);
      if (t) return t;
    }
    return "";
  }
  return "";
}

export function newBlockId(): BlockId {
  return crypto.randomUUID();
}

function coerceChecklistItems(raw: unknown): ChecklistItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ content: "", checked: false }];
  }
  const out: ChecklistItem[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      out.push({ content: item, checked: false });
      continue;
    }
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const detailTemplate =
        parseDetailTemplateFromAi(o.detailTemplate) ?? parseDetailTemplateFromAi(o.detail_template);
      out.push({
        content: coerceText(o.content ?? o.text ?? o.label ?? ""),
        checked: Boolean(o.checked ?? o.done),
        ...(detailTemplate ? { detailTemplate } : {}),
      });
    }
  }
  return out.length ? out : [{ content: "", checked: false }];
}

/** Maps common AI aliases to canonical block types. */
function resolveAiBlockType(raw: Record<string, unknown>): string | null {
  let t = String(raw.type ?? "").trim();
  if (!t) return null;
  t = t.toLowerCase().replace(/-/g, "_");
  if (t === "table") return "database_table";
  if (t === "heading") {
    const lv = Number(raw.level ?? raw.depth ?? 2);
    if (lv === 1) return "heading1";
    if (lv === 3) return "heading3";
    return "heading2";
  }
  return t;
}

export function remapBlockIds(block: TemplateBlock): TemplateBlock {
  const id = newBlockId();
  if (block.type === "monthly_calendar") {
    return {
      ...block,
      id,
      dayDetailTemplate: block.dayDetailTemplate
        ? { blocks: block.dayDetailTemplate.blocks.map(remapBlockIds) }
        : undefined,
    };
  }
  if (block.type === "checklist") {
    return {
      ...block,
      id,
      items: block.items.map((item) => ({
        ...item,
        detailTemplate: item.detailTemplate
          ? { blocks: item.detailTemplate.blocks.map(remapBlockIds) }
          : undefined,
      })),
    };
  }
  if (block.type === "toggle" || block.type === "sub_page" || block.type === "linked_page") {
    return { ...block, id, children: block.children.map(remapBlockIds) };
  }
  if (block.type === "columns") {
    return {
      ...block,
      id,
      children: block.children.map((col) => col.map(remapBlockIds)),
    };
  }
  return { ...block, id } as TemplateBlock;
}

/** Replaces {{행제목}} / {{row_title}} in detailTemplate blocks when opening a row view. */
export function replaceDetailRowTitlePlaceholders(text: string, rowTitle: string): string {
  if (!text) return text;
  return text
    .replace(/\{\{행제목\}\}/g, rowTitle)
    .replace(/\{\{row_title\}\}/gi, rowTitle)
    .replace(/\{\{ROW_TITLE\}\}/g, rowTitle);
}

export function isNavigationGuideCalloutContent(content: string): boolean {
  const t = content.trim().toLowerCase();
  if (!t) return false;
  const patterns = [
    "행을 클릭",
    "행 클릭",
    "세부 page로 이동",
    "상세 page로 이동",
    "클릭하면 이동",
    "누르면 이동",
    "클릭하면 세부",
  ];
  return patterns.some((p) => t.includes(p));
}

function applyDetailRowTitlePlaceholdersToBlock(block: TemplateBlock, rowTitle: string): TemplateBlock {
  const r = (s: string) => replaceDetailRowTitlePlaceholders(s, rowTitle);
  switch (block.type) {
    case "heading1":
    case "heading2":
    case "heading3":
      return { ...block, content: r(block.content) };
    case "paragraph":
      return { ...block, content: r(block.content) };
    case "bulleted_list":
      return { ...block, items: block.items.map((i) => r(i)) };
    case "numbered_list":
      return { ...block, items: block.items.map((i) => r(i)) };
    case "to_do":
      return { ...block, content: r(block.content) };
    case "checklist":
      return {
        ...block,
        items: block.items.map((it) => ({
          ...it,
          content: r(it.content),
          detailTemplate: it.detailTemplate
            ? {
                blocks: it.detailTemplate.blocks.map((b) =>
                  applyDetailRowTitlePlaceholdersToBlock(b, rowTitle)
                ),
              }
            : undefined,
        })),
      };
    case "toggle":
      return {
        ...block,
        title: r(block.title),
        children: block.children.map((c) => applyDetailRowTitlePlaceholdersToBlock(c, rowTitle)),
      };
    case "sub_page":
      return {
        ...block,
        title: r(block.title),
        ...(block.icon ? { icon: r(block.icon) } : {}),
        children: block.children.map((c) => applyDetailRowTitlePlaceholdersToBlock(c, rowTitle)),
      };
    case "linked_page":
      return {
        ...block,
        title: r(block.title),
        ...(block.icon ? { icon: r(block.icon) } : {}),
        ...(block.description ? { description: r(block.description) } : {}),
        children: block.children.map((c) => applyDetailRowTitlePlaceholdersToBlock(c, rowTitle)),
      };
    case "callout":
      return { ...block, content: r(block.content) };
    case "quote":
      return { ...block, content: r(block.content) };
    case "database_table":
      return {
        ...block,
        title: r(block.title),
        columns: block.columns.map((c) => ({ ...c, name: r(c.name) })),
        detailTemplate: block.detailTemplate
          ? {
              blocks: block.detailTemplate.blocks.map((b) =>
                applyDetailRowTitlePlaceholdersToBlock(b, rowTitle)
              ),
            }
          : undefined,
        rows: block.rows,
      };
    case "database_board":
      return {
        ...block,
        title: r(block.title),
        groupBy: r(block.groupBy),
        columns: block.columns.map((c) => ({ ...c, name: r(c.name) })),
        rows: block.rows,
      };
    case "database_calendar":
      return {
        ...block,
        title: r(block.title),
        dateColumn: r(block.dateColumn),
        columns: block.columns.map((c) => ({ ...c, name: r(c.name) })),
        rows: block.rows,
      };
    case "database_gallery":
      return {
        ...block,
        title: r(block.title),
        imageColumn: r(block.imageColumn),
        columns: block.columns.map((c) => ({ ...c, name: r(c.name) })),
        rows: block.rows,
      };
    case "monthly_calendar":
      return {
        ...block,
        title: r(block.title),
        dayDetailTemplate: block.dayDetailTemplate
          ? {
              blocks: block.dayDetailTemplate.blocks.map((b) =>
                applyDetailRowTitlePlaceholdersToBlock(b, rowTitle)
              ),
            }
          : undefined,
      };
    case "columns":
      return {
        ...block,
        children: block.children.map((col) =>
          col.map((c) => applyDetailRowTitlePlaceholdersToBlock(c, rowTitle))
        ),
      };
    case "code":
      return { ...block, content: r(block.content) };
    case "image":
      return {
        ...block,
        ...(block.alt ? { alt: r(block.alt) } : {}),
        ...(block.caption ? { caption: r(block.caption) } : {}),
      };
    case "bookmark":
      return {
        ...block,
        ...(block.title ? { title: r(block.title) } : {}),
        ...(block.description ? { description: r(block.description) } : {}),
      };
    case "embed":
      return { ...block, ...(block.title ? { title: r(block.title) } : {}) };
    default:
      return block;
  }
}

export function instantiateDetailTemplate(
  template: DatabaseTableDetailTemplate,
  rowTitle: string
): TemplateBlock[] {
  return template.blocks.map((b) =>
    remapBlockIds(applyDetailRowTitlePlaceholdersToBlock(b, rowTitle))
  );
}

function parseDetailTemplateFromAi(raw: unknown): DatabaseTableDetailTemplate | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.blocks)) return undefined;
  const tpl = o.blocks
    .map((b) => normalizeAiBlock(b as Record<string, unknown>))
    .filter((b): b is TemplateBlock => b !== null)
    .map(padMinRowsOnDatabaseBlocks);
  if (tpl.length === 0) return undefined;
  return { blocks: tpl };
}

export function normalizeAiBlock(raw: Record<string, unknown>, id?: BlockId): TemplateBlock | null {
  const bid = pickBlockId(raw, id);
  const type = resolveAiBlockType(raw);
  if (!type) return null;
  switch (type) {
    case "heading1":
    case "heading2":
    case "heading3":
      return { id: bid, type, content: coerceText(raw.content ?? raw.text ?? raw.title) };
    case "paragraph":
      return { id: bid, type: "paragraph", content: coerceText(raw.content ?? raw.text) };
    case "bulleted_list":
      return {
        id: bid,
        type: "bulleted_list",
        items: Array.isArray(raw.items) ? (raw.items as unknown[]).map(String) : [],
      };
    case "numbered_list":
      return {
        id: bid,
        type: "numbered_list",
        items: Array.isArray(raw.items) ? (raw.items as unknown[]).map(String) : [],
      };
    case "to_do":
      return {
        id: bid,
        type: "to_do",
        content: coerceText(raw.content),
        checked: Boolean(raw.checked),
      };
    case "checklist":
      return {
        id: bid,
        type: "checklist",
        items: coerceChecklistItems(raw.items),
      };
    case "toggle": {
      const childrenRaw = Array.isArray(raw.children) ? (raw.children as Record<string, unknown>[]) : [];
      const children = childrenRaw
        .map((c) => normalizeAiBlock(c))
        .filter((b): b is TemplateBlock => b !== null);
      return { id: bid, type: "toggle", title: coerceText(raw.title), children };
    }
    case "sub_page": {
      const childrenRaw = Array.isArray(raw.children) ? (raw.children as Record<string, unknown>[]) : [];
      const children = childrenRaw
        .map((c) => normalizeAiBlock(c))
        .filter((b): b is TemplateBlock => b !== null);
      return {
        id: bid,
        type: "sub_page",
        title: coerceText(raw.title),
        ...(raw.icon != null && String(raw.icon).trim() ? { icon: coerceText(raw.icon) } : {}),
        children,
      };
    }
    case "linked_page": {
      const childrenRaw = Array.isArray(raw.children) ? (raw.children as Record<string, unknown>[]) : [];
      const children = childrenRaw
        .map((c) => normalizeAiBlock(c))
        .filter((b): b is TemplateBlock => b !== null);
      return {
        id: bid,
        type: "linked_page",
        title: coerceText(raw.title),
        ...(raw.icon != null && String(raw.icon).trim() ? { icon: coerceText(raw.icon) } : {}),
        ...(raw.description != null && String(raw.description).trim()
          ? { description: coerceText(raw.description) }
          : {}),
        ...(raw.url != null && String(raw.url).trim() ? { url: String(raw.url).trim() } : {}),
        children,
      };
    }
    case "callout":
      return {
        id: bid,
        type: "callout",
        icon: coerceText(raw.icon) || "💡",
        content: coerceText(raw.content ?? raw.text ?? raw.message),
      };
    case "quote":
      return { id: bid, type: "quote", content: coerceText(raw.content ?? raw.text) };
    case "divider":
      return { id: bid, type: "divider" };
    case "code":
      return {
        id: bid,
        type: "code",
        language: coerceText(raw.language) || "plaintext",
        content: coerceText(raw.content),
      };
    case "image":
      return {
        id: bid,
        type: "image",
        src: raw.src ? String(raw.src) : undefined,
        alt: raw.alt ? String(raw.alt) : undefined,
        caption: raw.caption ? String(raw.caption) : undefined,
      };
    case "bookmark":
      return {
        id: bid,
        type: "bookmark",
        url: String(raw.url ?? ""),
        title: raw.title ? String(raw.title) : undefined,
        description: raw.description ? String(raw.description) : undefined,
      };
    case "database_table": {
      let columns = coerceDatabaseColumns(raw.columns);
      let rows = normalizeDatabaseRowsFromAi(raw.rows, columns);
      ({ columns, rows } = stripMetaLinkColumnsFromDatabaseTable(columns, rows));
      const detailTemplate =
        parseDetailTemplateFromAi(raw.detailTemplate) ??
        parseDetailTemplateFromAi(raw.detail_template);
      return {
        id: bid,
        type: "database_table",
        title: String(raw.title ?? ""),
        columns,
        rows,
        ...(detailTemplate ? { detailTemplate } : {}),
      };
    }
    case "database_board": {
      let columns = coerceDatabaseColumns(raw.columns);
      let rows = normalizeDatabaseRowsFromAi(raw.rows, columns);
      ({ columns, rows } = stripMetaLinkColumnsFromDatabaseTable(columns, rows));
      return {
        id: bid,
        type: "database_board",
        title: String(raw.title ?? ""),
        groupBy: String(raw.groupBy ?? "Status"),
        columns,
        rows,
      };
    }
    case "database_calendar": {
      let columns = coerceDatabaseColumns(raw.columns);
      let rows = normalizeDatabaseRowsFromAi(raw.rows, columns);
      ({ columns, rows } = stripMetaLinkColumnsFromDatabaseTable(columns, rows));
      return {
        id: bid,
        type: "database_calendar",
        title: String(raw.title ?? ""),
        dateColumn: String(raw.dateColumn ?? "Date"),
        columns,
        rows,
      };
    }
    case "database_gallery": {
      let columns = coerceDatabaseColumns(raw.columns);
      let rows = normalizeDatabaseRowsFromAi(raw.rows, columns);
      ({ columns, rows } = stripMetaLinkColumnsFromDatabaseTable(columns, rows));
      return {
        id: bid,
        type: "database_gallery",
        title: String(raw.title ?? ""),
        imageColumn: String(raw.imageColumn ?? "Image"),
        columns,
        rows,
      };
    }
    case "monthly_calendar": {
      const now = new Date();
      const rawDays = raw.days && typeof raw.days === "object" ? (raw.days as Record<string, unknown>) : {};
      const days: Record<string, MonthlyCalendarDayState> = {};
      for (const [key, val] of Object.entries(rawDays)) {
        if (!val || typeof val !== "object") continue;
        const d = val as Record<string, unknown>;
        days[String(key)] = {
          checked: Boolean(d.checked),
          hasContent: Boolean(d.hasContent ?? d.has_content),
        };
      }
      const dayDetailTemplate =
        parseDetailTemplateFromAi(raw.dayDetailTemplate) ??
        parseDetailTemplateFromAi(raw.day_detail_template);
      return {
        id: bid,
        type: "monthly_calendar",
        title: String(raw.title ?? "Monthly Calendar"),
        year: Number(raw.year ?? now.getFullYear()),
        month: Number(raw.month ?? now.getMonth() + 1),
        days,
        ...(dayDetailTemplate ? { dayDetailTemplate } : {}),
      };
    }
    case "columns": {
      const cols = Array.isArray(raw.children) ? (raw.children as unknown[]) : [];
      const children = cols.map((col) =>
        Array.isArray(col)
          ? (col as Record<string, unknown>[])
              .map((c) => normalizeAiBlock(c))
              .filter((b): b is TemplateBlock => b !== null)
          : []
      );
      return {
        id: bid,
        type: "columns",
        layout: raw.layout === "3" ? "3" : "2",
        children,
      };
    }
    case "embed":
      return {
        id: bid,
        type: "embed",
        src: String(raw.src ?? ""),
        title: raw.title ? String(raw.title) : undefined,
      };
    default:
      return null;
  }
}

/** Pads database rows for AI-generated payloads only (not used on plain server load). */
function padMinRowsOnDatabaseBlocks(block: TemplateBlock): TemplateBlock {
  if (block.type === "database_table") {
    const rows = padDatabaseRowsToMin(block.columns, block.rows);
    if (!block.detailTemplate?.blocks?.length) {
      return { ...block, rows };
    }
    return {
      ...block,
      rows,
      detailTemplate: {
        blocks: block.detailTemplate.blocks.map(padMinRowsOnDatabaseBlocks),
      },
    };
  }
  if (block.type === "database_board") {
    return { ...block, rows: padDatabaseRowsToMin(block.columns, block.rows) };
  }
  if (block.type === "database_calendar") {
    return { ...block, rows: padDatabaseRowsToMin(block.columns, block.rows) };
  }
  if (block.type === "database_gallery") {
    return { ...block, rows: padDatabaseRowsToMin(block.columns, block.rows) };
  }
  if (block.type === "monthly_calendar") {
    if (!block.dayDetailTemplate?.blocks?.length) return block;
    return {
      ...block,
      dayDetailTemplate: {
        blocks: block.dayDetailTemplate.blocks.map(padMinRowsOnDatabaseBlocks),
      },
    };
  }
  if (block.type === "checklist") {
    return {
      ...block,
      items: block.items.map((item) => ({
        ...item,
        detailTemplate: item.detailTemplate
          ? {
              blocks: item.detailTemplate.blocks.map(padMinRowsOnDatabaseBlocks),
            }
          : undefined,
      })),
    };
  }
  if (block.type === "toggle" || block.type === "sub_page" || block.type === "linked_page") {
    return { ...block, children: block.children.map(padMinRowsOnDatabaseBlocks) };
  }
  if (block.type === "columns") {
    return {
      ...block,
      children: block.children.map((col) => col.map(padMinRowsOnDatabaseBlocks)),
    };
  }
  return block;
}

export function normalizeAiTemplate(payload: AITemplatePayload): {
  title: string;
  icon: string;
  cover: string | null;
  blocks: TemplateBlock[];
} {
  let blocks = (payload.blocks ?? [])
    .map((b) => normalizeAiBlock(b as Record<string, unknown>))
    .filter((b): b is TemplateBlock => b !== null)
    .map(padMinRowsOnDatabaseBlocks);
  blocks = stripInvalidLinkedSectionIds(blocks);
  return {
    title: payload.title || "제목 없음",
    icon: payload.icon || "📄",
    cover: payload.cover ?? null,
    blocks,
  };
}

export function normalizeDocumentBlocksFromAi(raw: unknown): TemplateBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b) => normalizeAiBlock(b as Record<string, unknown>))
    .filter((b): b is TemplateBlock => b !== null);
}

/** Every linkedSectionId referenced from any database row anywhere in the tree. */
export function collectLinkedSectionTargets(blocks: TemplateBlock[]): Set<string> {
  const s = new Set<string>();
  const walkRows = (rows: DatabaseRow[]) => {
    for (const r of rows) {
      const lid = r.linkedSectionId?.trim();
      if (lid) s.add(lid);
    }
  };
  const walk = (b: TemplateBlock) => {
    if (
      b.type === "database_table" ||
      b.type === "database_board" ||
      b.type === "database_calendar" ||
      b.type === "database_gallery"
    ) {
      walkRows(b.rows);
    }
    if (b.type === "toggle" || b.type === "sub_page" || b.type === "linked_page") {
      b.children.forEach(walk);
    }
    if (b.type === "columns") {
      b.children.forEach((col) => col.forEach(walk));
    }
  };
  blocks.forEach(walk);
  return s;
}

/**
 * Root blocks shown when opening a master row: starting at linkedSectionId, consecutive roots
 * until another block that is itself a linked detail anchor (keeps multi-block detail sections together).
 */
export function getDetailRootIdsForLinkedSection(
  linkedSectionId: string,
  rootBlocks: TemplateBlock[],
  allLinkedTargets: Set<string>
): string[] {
  const id = linkedSectionId.trim();
  if (!id) return [];
  const start = rootBlocks.findIndex((r) => r.id === id);
  if (start < 0) return [];
  const ids: string[] = [];
  for (let i = start; i < rootBlocks.length; i++) {
    const r = rootBlocks[i];
    if (i > start && allLinkedTargets.has(r.id)) break;
    ids.push(r.id);
  }
  return ids;
}

/** Root-level block ids omitted from the master canvas (opened only via table row). */
export function collectHiddenRootIdsForMasterView(
  rootBlocks: TemplateBlock[],
  allLinkedTargets: Set<string>
): Set<string> {
  const hidden = new Set<string>();
  for (const lt of Array.from(allLinkedTargets)) {
    for (const id of getDetailRootIdsForLinkedSection(lt, rootBlocks, allLinkedTargets)) {
      hidden.add(id);
    }
  }
  return hidden;
}
