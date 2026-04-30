import { newBlockId } from "@/types/template";
import type { TemplateBlock } from "@/types/template";

/** Notion-style starter: title + empty paragraph. */
export function createBlankTemplateBlocks(): TemplateBlock[] {
  return [
    { id: newBlockId(), type: "heading1", content: "무제" },
    { id: newBlockId(), type: "paragraph", content: "" },
  ];
}
