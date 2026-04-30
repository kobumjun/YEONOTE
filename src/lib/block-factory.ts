import { newBlockId, type TemplateBlock } from "@/types/template";

export type InsertableBlockType = TemplateBlock["type"];

export function createBlock(type: InsertableBlockType): TemplateBlock {
  const id = newBlockId();
  switch (type) {
    case "heading1":
      return { id, type: "heading1", content: "Heading 1" };
    case "heading2":
      return { id, type: "heading2", content: "Heading 2" };
    case "heading3":
      return { id, type: "heading3", content: "Heading 3" };
    case "paragraph":
      return { id, type: "paragraph", content: "" };
    case "bulleted_list":
      return { id, type: "bulleted_list", items: ["Item"] };
    case "numbered_list":
      return { id, type: "numbered_list", items: ["Item"] };
    case "to_do":
      return { id, type: "to_do", content: "To-do", checked: false };
    case "toggle":
      return { id, type: "toggle", title: "Toggle", children: [{ id: newBlockId(), type: "paragraph", content: "" }] };
    case "callout":
      return { id, type: "callout", icon: "💡", content: "Callout content" };
    case "quote":
      return { id, type: "quote", content: "Quote" };
    case "divider":
      return { id, type: "divider" };
    case "code":
      return { id, type: "code", language: "typescript", content: "// code" };
    case "image":
      return { id, type: "image", alt: "" };
    case "bookmark":
      return { id, type: "bookmark", url: "https://example.com" };
    case "database_table":
      return {
        id,
        type: "database_table",
        title: "Table",
        columns: [
          { name: "Name", type: "title" },
          { name: "Notes", type: "text" },
        ],
        rows: [{ Name: "Sample" }],
      };
    case "database_board":
      return {
        id,
        type: "database_board",
        title: "Board",
        groupBy: "Status",
        columns: [
          { name: "Title", type: "title" },
          { name: "Status", type: "select", options: ["To do", "In progress", "Done"] },
        ],
        rows: [{ Title: "Card 1", Status: "To do" }],
      };
    case "database_calendar":
      return {
        id,
        type: "database_calendar",
        title: "Calendar",
        dateColumn: "Date",
        columns: [
          { name: "Date", type: "date" },
          { name: "Event", type: "title" },
        ],
        rows: [{ Date: "2026-04-30", Event: "YEO launch" }],
      };
    case "database_gallery":
      return {
        id,
        type: "database_gallery",
        title: "Gallery",
        imageColumn: "Thumbnail",
        columns: [
          { name: "Thumbnail", type: "text" },
          { name: "Title", type: "title" },
        ],
        rows: [{ Thumbnail: "🖼", Title: "Item" }],
      };
    case "columns":
      return {
        id,
        type: "columns",
        layout: "2",
        children: [
          [{ id: newBlockId(), type: "paragraph", content: "Left" }],
          [{ id: newBlockId(), type: "paragraph", content: "Right" }],
        ],
      };
    case "embed":
      return { id, type: "embed", src: "https://www.youtube.com/embed/dQw4w9WgXcQ", title: "YouTube" };
    default:
      return { id, type: "paragraph", content: "" };
  }
}
