export type BlockId = string;

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

export type DatabaseRow = Record<string, string | number | boolean | null | undefined>;

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

const MIN_AI_DATABASE_ROWS = 3;

/** Ensures AI/imported tables have enough starter rows (date cells default to today in ISO). */
export function padDatabaseRowsToMin(columns: DatabaseColumn[], rows: DatabaseRow[]): DatabaseRow[] {
  if (columns.length === 0) return rows;
  const today = new Date().toISOString().slice(0, 10);
  const out = [...rows];
  const makeRow = (): DatabaseRow => {
    const r: DatabaseRow = {};
    for (const c of columns) {
      if (c.type === "checkbox") r[c.name] = false;
      else if (c.type === "number") r[c.name] = null;
      else if (c.type === "date") r[c.name] = today;
      else r[c.name] = "";
    }
    return r;
  };
  while (out.length < MIN_AI_DATABASE_ROWS) out.push(makeRow());
  return out;
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

export type DatabaseTableBlock = BlockBase & {
  type: "database_table";
  title: string;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
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
  | ColumnsBlock
  | EmbedBlock;

export type TemplateContent = {
  blocks: TemplateBlock[];
};

export type AITemplatePayload = {
  title: string;
  icon?: string;
  cover?: string;
  blocks: unknown[];
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
      out.push({
        content: coerceText(o.content ?? o.text ?? o.label ?? ""),
        checked: Boolean(o.checked ?? o.done),
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

export function normalizeAiBlock(raw: Record<string, unknown>, id?: BlockId): TemplateBlock | null {
  const bid = id ?? newBlockId();
  const type = resolveAiBlockType(raw);
  if (!type) return null;
  switch (type) {
    case "heading1":
    case "heading2":
    case "heading3":
      return { id: bid, type, content: coerceText(raw.content) };
    case "paragraph":
      return { id: bid, type: "paragraph", content: coerceText(raw.content) };
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
        content: coerceText(raw.content),
      };
    case "quote":
      return { id: bid, type: "quote", content: coerceText(raw.content) };
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
    case "database_table":
      return {
        id: bid,
        type: "database_table",
        title: String(raw.title ?? ""),
        columns: coerceDatabaseColumns(raw.columns),
        rows: Array.isArray(raw.rows) ? (raw.rows as DatabaseRow[]) : [],
      };
    case "database_board":
      return {
        id: bid,
        type: "database_board",
        title: String(raw.title ?? ""),
        groupBy: String(raw.groupBy ?? "Status"),
        columns: coerceDatabaseColumns(raw.columns),
        rows: Array.isArray(raw.rows) ? (raw.rows as DatabaseRow[]) : [],
      };
    case "database_calendar":
      return {
        id: bid,
        type: "database_calendar",
        title: String(raw.title ?? ""),
        dateColumn: String(raw.dateColumn ?? "Date"),
        columns: coerceDatabaseColumns(raw.columns),
        rows: Array.isArray(raw.rows) ? (raw.rows as DatabaseRow[]) : [],
      };
    case "database_gallery":
      return {
        id: bid,
        type: "database_gallery",
        title: String(raw.title ?? ""),
        imageColumn: String(raw.imageColumn ?? "Image"),
        columns: coerceDatabaseColumns(raw.columns),
        rows: Array.isArray(raw.rows) ? (raw.rows as DatabaseRow[]) : [],
      };
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
    return { ...block, rows: padDatabaseRowsToMin(block.columns, block.rows) };
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
  const blocks = (payload.blocks ?? [])
    .map((b) => normalizeAiBlock(b as Record<string, unknown>))
    .filter((b): b is TemplateBlock => b !== null)
    .map(padMinRowsOnDatabaseBlocks);
  return {
    title: payload.title || "제목 없음",
    icon: payload.icon || "📄",
    cover: payload.cover ?? null,
    blocks,
  };
}
