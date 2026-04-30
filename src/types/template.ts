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

export type ToggleBlock = BlockBase & {
  type: "toggle";
  title: string;
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
  | ToggleBlock
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

export function remapBlockIds(block: TemplateBlock): TemplateBlock {
  const id = newBlockId();
  if (block.type === "toggle") {
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
  const type = raw.type as string;
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
    case "toggle": {
      const childrenRaw = Array.isArray(raw.children) ? (raw.children as Record<string, unknown>[]) : [];
      const children = childrenRaw
        .map((c) => normalizeAiBlock(c))
        .filter((b): b is TemplateBlock => b !== null);
      return { id: bid, type: "toggle", title: coerceText(raw.title), children };
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
        columns: Array.isArray(raw.columns) ? (raw.columns as DatabaseColumn[]) : [],
        rows: Array.isArray(raw.rows) ? (raw.rows as DatabaseRow[]) : [],
      };
    case "database_board":
      return {
        id: bid,
        type: "database_board",
        title: String(raw.title ?? ""),
        groupBy: String(raw.groupBy ?? "Status"),
        columns: Array.isArray(raw.columns) ? (raw.columns as DatabaseColumn[]) : [],
        rows: Array.isArray(raw.rows) ? (raw.rows as DatabaseRow[]) : [],
      };
    case "database_calendar":
      return {
        id: bid,
        type: "database_calendar",
        title: String(raw.title ?? ""),
        dateColumn: String(raw.dateColumn ?? "Date"),
        columns: Array.isArray(raw.columns) ? (raw.columns as DatabaseColumn[]) : [],
        rows: Array.isArray(raw.rows) ? (raw.rows as DatabaseRow[]) : [],
      };
    case "database_gallery":
      return {
        id: bid,
        type: "database_gallery",
        title: String(raw.title ?? ""),
        imageColumn: String(raw.imageColumn ?? "Image"),
        columns: Array.isArray(raw.columns) ? (raw.columns as DatabaseColumn[]) : [],
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

export function normalizeAiTemplate(payload: AITemplatePayload): {
  title: string;
  icon: string;
  cover: string | null;
  blocks: TemplateBlock[];
} {
  const blocks = (payload.blocks ?? [])
    .map((b) => normalizeAiBlock(b as Record<string, unknown>))
    .filter((b): b is TemplateBlock => b !== null);
  return {
    title: payload.title || "Untitled",
    icon: payload.icon || "📄",
    cover: payload.cover ?? null,
    blocks,
  };
}
