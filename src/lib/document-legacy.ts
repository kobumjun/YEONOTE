import { createBlock } from "@/lib/block-factory";
import { newBlockId, type TemplateBlock } from "@/types/template";

/** Best-effort migration when a document only has legacy HTML in storage. */
export function legacyHtmlDocumentToBlocks(html: string | undefined | null): TemplateBlock[] {
  if (!html?.trim()) return [createBlock("paragraph")];
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return [{ id: newBlockId(), type: "paragraph", content: text || "" }];
}
