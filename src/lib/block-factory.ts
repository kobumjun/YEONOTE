import { newBlockId, type TemplateBlock } from "@/types/template";

export type InsertableBlockType = TemplateBlock["type"];

export function createBlock(type: InsertableBlockType): TemplateBlock {
  const id = newBlockId();
  switch (type) {
    case "heading1":
      return { id, type: "heading1", content: "제목 1" };
    case "heading2":
      return { id, type: "heading2", content: "제목 2" };
    case "heading3":
      return { id, type: "heading3", content: "제목 3" };
    case "paragraph":
      return { id, type: "paragraph", content: "" };
    case "bulleted_list":
      return { id, type: "bulleted_list", items: ["항목"] };
    case "numbered_list":
      return { id, type: "numbered_list", items: ["항목"] };
    case "to_do":
      return { id, type: "to_do", content: "할 일", checked: false };
    case "toggle":
      return { id, type: "toggle", title: "토글", children: [{ id: newBlockId(), type: "paragraph", content: "" }] };
    case "callout":
      return { id, type: "callout", icon: "💡", content: "콜아웃 내용" };
    case "quote":
      return { id, type: "quote", content: "인용문" };
    case "divider":
      return { id, type: "divider" };
    case "code":
      return { id, type: "code", language: "typescript", content: "// 코드" };
    case "image":
      return { id, type: "image", alt: "" };
    case "bookmark":
      return { id, type: "bookmark", url: "https://example.com" };
    case "database_table":
      return {
        id,
        type: "database_table",
        title: "표",
        columns: [
          { name: "이름", type: "title" },
          { name: "메모", type: "text" },
        ],
        rows: [{ 이름: "샘플" }],
      };
    case "database_board":
      return {
        id,
        type: "database_board",
        title: "보드",
        groupBy: "상태",
        columns: [
          { name: "제목", type: "title" },
          { name: "상태", type: "select", options: ["할 일", "진행 중", "완료"] },
        ],
        rows: [{ 제목: "카드 1", 상태: "할 일" }],
      };
    case "database_calendar":
      return {
        id,
        type: "database_calendar",
        title: "캘린더",
        dateColumn: "날짜",
        columns: [
          { name: "날짜", type: "date" },
          { name: "일정", type: "title" },
        ],
        rows: [{ 날짜: "2026-04-30", 일정: "YEO 런칭" }],
      };
    case "database_gallery":
      return {
        id,
        type: "database_gallery",
        title: "갤러리",
        imageColumn: "썸네일",
        columns: [
          { name: "썸네일", type: "text" },
          { name: "제목", type: "title" },
        ],
        rows: [{ 썸네일: "🖼", 제목: "항목" }],
      };
    case "columns":
      return {
        id,
        type: "columns",
        layout: "2",
        children: [
          [{ id: newBlockId(), type: "paragraph", content: "왼쪽" }],
          [{ id: newBlockId(), type: "paragraph", content: "오른쪽" }],
        ],
      };
    case "embed":
      return { id, type: "embed", src: "https://www.youtube.com/embed/dQw4w9WgXcQ", title: "YouTube" };
    default:
      return { id, type: "paragraph", content: "" };
  }
}
