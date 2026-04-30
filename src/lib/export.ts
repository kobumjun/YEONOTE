import type { TemplateBlock } from "@/types/template";

function blockToMarkdown(block: TemplateBlock, depth = 0): string {
  switch (block.type) {
    case "heading1":
      return `# ${block.content}\n\n`;
    case "heading2":
      return `## ${block.content}\n\n`;
    case "heading3":
      return `### ${block.content}\n\n`;
    case "paragraph":
      return `${block.content}\n\n`;
    case "bulleted_list":
      return block.items.map((i) => `- ${i}`).join("\n") + "\n\n";
    case "numbered_list":
      return block.items.map((i, n) => `${n + 1}. ${i}`).join("\n") + "\n\n";
    case "to_do":
      return `- [${block.checked ? "x" : " "}] ${block.content}\n`;
    case "toggle": {
      const inner = block.children.map((c) => blockToMarkdown(c, depth + 1)).join("");
      return `<details><summary>${block.title}</summary>\n\n${inner}\n</details>\n\n`;
    }
    case "callout":
      return `> ${block.icon} ${block.content}\n\n`;
    case "quote":
      return `> ${block.content}\n\n`;
    case "divider":
      return "---\n\n";
    case "code":
      return `\`\`\`${block.language}\n${block.content}\n\`\`\`\n\n`;
    case "image":
      return block.src ? `![${block.alt ?? ""}](${block.src})\n\n` : "\n";
    case "bookmark":
      return `[${block.title ?? block.url}](${block.url})\n\n`;
    case "database_table":
    case "database_board":
    case "database_calendar":
    case "database_gallery": {
      const cols = block.columns.map((c) => c.name);
      const header = `| ${cols.join(" | ")} |`;
      const sep = `| ${cols.map(() => "---").join(" | ")} |`;
      const rows = block.rows
        .map((r) => `| ${cols.map((c) => String(r[c] ?? "")).join(" | ")} |`)
        .join("\n");
      return `### ${block.title}\n\n${header}\n${sep}\n${rows}\n\n`;
    }
    case "columns":
      return block.children.map((col) => col.map((b) => blockToMarkdown(b)).join("")).join("\n---\n\n");
    case "embed":
      return `<iframe src="${block.src}" title="${block.title ?? ""}"></iframe>\n\n`;
    default:
      return "";
  }
}

export function templateToMarkdown(title: string, blocks: TemplateBlock[]): string {
  return `# ${title}\n\n${blocks.map((b) => blockToMarkdown(b)).join("")}`;
}
