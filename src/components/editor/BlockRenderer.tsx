"use client";

import type { TemplateBlock } from "@/types/template";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { BlockToolbar } from "@/components/editor/BlockToolbar";

export function BlockRenderer({
  block,
  readOnly,
  onChange,
  onDelete,
  onDuplicate,
  depth = 0,
}: {
  block: TemplateBlock;
  readOnly?: boolean;
  onChange?: (id: string, patch: Partial<TemplateBlock>) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  depth?: number;
}) {
  const wrap = (child: React.ReactNode) => (
    <div className="group relative py-1 pl-1" style={{ marginLeft: depth * 12 }}>
      {!readOnly && onDelete && onDuplicate && onChange && (
        <BlockToolbar onDelete={() => onDelete(block.id)} onDuplicate={() => onDuplicate(block.id)} />
      )}
      {child}
    </div>
  );

  switch (block.type) {
    case "heading1":
      return wrap(
        readOnly ? (
          <h2 className="font-heading text-3xl font-bold text-surface-dark dark:text-white">{block.content}</h2>
        ) : (
          <input
            className="font-heading w-full border-0 bg-transparent text-3xl font-bold text-surface-dark outline-none focus:ring-2 focus:ring-yeo-500/30 dark:text-white rounded-md"
            value={block.content}
            onChange={(e) => onChange?.(block.id, { content: e.target.value } as Partial<TemplateBlock>)}
          />
        )
      );
    case "heading2":
      return wrap(
        readOnly ? (
          <h3 className="font-heading text-2xl font-semibold text-surface-dark dark:text-white">{block.content}</h3>
        ) : (
          <input
            className="font-heading w-full border-0 bg-transparent text-2xl font-semibold text-surface-dark outline-none focus:ring-2 focus:ring-yeo-500/30 dark:text-white rounded-md"
            value={block.content}
            onChange={(e) => onChange?.(block.id, { content: e.target.value } as Partial<TemplateBlock>)}
          />
        )
      );
    case "heading3":
      return wrap(
        readOnly ? (
          <h4 className="font-heading text-xl font-semibold text-surface-dark dark:text-white">{block.content}</h4>
        ) : (
          <input
            className="font-heading w-full border-0 bg-transparent text-xl font-semibold text-surface-dark outline-none focus:ring-2 focus:ring-yeo-500/30 dark:text-white rounded-md"
            value={block.content}
            onChange={(e) => onChange?.(block.id, { content: e.target.value } as Partial<TemplateBlock>)}
          />
        )
      );
    case "paragraph":
      return wrap(
        readOnly ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{block.content}</p>
        ) : (
          <textarea
            className="w-full resize-none border-0 bg-transparent p-1 text-sm leading-relaxed outline-none ring-0 focus:ring-2 focus:ring-yeo-500/30 rounded-md"
            rows={Math.max(2, block.content.split("\n").length)}
            value={block.content}
            onChange={(e) => onChange?.(block.id, { content: e.target.value } as Partial<TemplateBlock>)}
          />
        )
      );
    case "bulleted_list":
      return wrap(
        readOnly ? (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {block.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <ul className="list-none space-y-1 text-sm">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 text-muted-foreground">•</span>
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent p-0.5 outline-none focus:ring-2 focus:ring-yeo-500/30 rounded"
                  value={item}
                  onChange={(e) => {
                    const next = [...block.items];
                    next[i] = e.target.value;
                    onChange?.(block.id, { items: next } as Partial<TemplateBlock>);
                  }}
                />
              </li>
            ))}
          </ul>
        )
      );
    case "numbered_list":
      return wrap(
        readOnly ? (
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {block.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        ) : (
          <ol className="list-none space-y-1 text-sm">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-0.5 w-5 shrink-0 text-right text-muted-foreground">{i + 1}.</span>
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent p-0.5 outline-none focus:ring-2 focus:ring-yeo-500/30 rounded"
                  value={item}
                  onChange={(e) => {
                    const next = [...block.items];
                    next[i] = e.target.value;
                    onChange?.(block.id, { items: next } as Partial<TemplateBlock>);
                  }}
                />
              </li>
            ))}
          </ol>
        )
      );
    case "to_do":
      return wrap(
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={block.checked}
            disabled={readOnly}
            onCheckedChange={(v) => onChange?.(block.id, { checked: Boolean(v) } as Partial<TemplateBlock>)}
            className="mt-0.5"
          />
          {readOnly ? (
            <span className={block.checked ? "text-muted-foreground line-through" : ""}>{block.content}</span>
          ) : (
            <input
              className="flex-1 border-0 bg-transparent p-0 outline-none"
              value={block.content}
              onChange={(e) => onChange?.(block.id, { content: e.target.value } as Partial<TemplateBlock>)}
            />
          )}
        </label>
      );
    case "toggle":
      return wrap(
        <details className="rounded-lg border bg-muted/30 px-3 py-2">
          <summary className="cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">
            {readOnly ? (
              block.title
            ) : (
              <input
                className="w-full border-0 bg-transparent p-0 font-medium outline-none focus:ring-2 focus:ring-yeo-500/30 rounded"
                value={block.title}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onChange?.(block.id, { title: e.target.value } as Partial<TemplateBlock>)}
              />
            )}
          </summary>
          <div className="mt-2 space-y-1 border-l-2 border-yeo-300 pl-3 dark:border-yeo-700">
            {block.children.map((c) => (
              <BlockRenderer
                key={c.id}
                block={c}
                readOnly={readOnly}
                onChange={onChange}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                depth={depth + 1}
              />
            ))}
          </div>
        </details>
      );
    case "callout":
      return wrap(
        <div className="flex gap-3 rounded-lg border border-yeo-200 bg-yeo-50/90 p-4 text-sm dark:border-yeo-800 dark:bg-yeo-950/50">
          {readOnly ? (
            <span className="text-lg">{block.icon}</span>
          ) : (
            <input
              className="w-10 shrink-0 border-0 bg-transparent text-center text-lg outline-none"
              value={block.icon}
              onChange={(e) => onChange?.(block.id, { icon: e.target.value } as Partial<TemplateBlock>)}
              aria-label="콜아웃 아이콘"
            />
          )}
          <div className="min-w-0 flex-1">
            {readOnly ? (
              <div className="whitespace-pre-wrap">{block.content}</div>
            ) : (
              <textarea
                className="w-full resize-none border-0 bg-transparent p-0 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-yeo-500/30 rounded"
                rows={Math.max(2, block.content.split("\n").length)}
                value={block.content}
                onChange={(e) => onChange?.(block.id, { content: e.target.value } as Partial<TemplateBlock>)}
              />
            )}
          </div>
        </div>
      );
    case "quote":
      return wrap(
        readOnly ? (
          <blockquote className="border-l-4 border-yeo-400 pl-4 text-sm italic text-muted-foreground">{block.content}</blockquote>
        ) : (
          <textarea
            className="w-full resize-none border-l-4 border-yeo-400 bg-transparent pl-4 text-sm italic text-muted-foreground outline-none focus:ring-2 focus:ring-yeo-500/30 rounded-r"
            rows={Math.max(2, block.content.split("\n").length)}
            value={block.content}
            onChange={(e) => onChange?.(block.id, { content: e.target.value } as Partial<TemplateBlock>)}
          />
        )
      );
    case "divider":
      return wrap(<hr className="my-4 border-t border-border" />);
    case "code":
      return wrap(
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
          <span className="mb-2 block text-[10px] uppercase text-slate-400">{block.language}</span>
          <code>{block.content}</code>
        </pre>
      );
    case "image":
      return wrap(
        <figure className="rounded-lg border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
          {block.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.src} alt={block.alt ?? ""} className="mx-auto max-h-64 rounded-md" />
          ) : (
            <div className="py-8">이미지 자리</div>
          )}
          {block.caption ? <figcaption className="mt-2">{block.caption}</figcaption> : null}
        </figure>
      );
    case "bookmark":
      return wrap(
        <a
          href={block.url}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col gap-1 rounded-lg border bg-card p-4 text-sm shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <span className="font-medium text-yeo-700 dark:text-yeo-300">{block.title ?? block.url}</span>
          {block.description ? <span className="text-muted-foreground">{block.description}</span> : null}
          <span className="truncate text-xs text-muted-foreground">{block.url}</span>
        </a>
      );
    case "database_table":
      return wrap(
        <div className="overflow-x-auto rounded-lg border shadow-sm">
          <div className="border-b bg-muted/50 px-3 py-2 text-sm font-medium">{block.title}</div>
          <table className="w-full min-w-[320px] text-left text-xs">
            <thead>
              <tr className="border-b bg-muted/30">
                {block.columns.map((c) => (
                  <th key={c.name} className="px-2 py-2 font-medium">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-b last:border-0">
                  {block.columns.map((c) => (
                    <td key={c.name} className="px-2 py-2">
                      {String(row[c.name] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "database_board": {
      const colKey = block.groupBy;
      const groups = new Map<string, typeof block.rows>();
      for (const row of block.rows) {
        const k = String(row[colKey] ?? "기타");
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(row);
      }
      return wrap(
        <div className="space-y-2">
          <p className="text-sm font-medium">{block.title}</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from(groups.entries()).map(([name, rows]) => (
              <div key={name} className="min-w-[200px] flex-1 rounded-lg border bg-muted/20 p-2">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">{name}</p>
                <div className="space-y-2">
                  {rows.map((row, i) => (
                    <div key={i} className="rounded-md border bg-card p-2 text-xs shadow-sm">
                      {block.columns
                        .filter((c) => c.name !== colKey)
                        .map((c) => (
                          <div key={c.name}>
                            <span className="text-muted-foreground">{c.name}: </span>
                            {String(row[c.name] ?? "")}
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "database_calendar": {
      const dk = block.dateColumn;
      return wrap(
        <div className="rounded-lg border shadow-sm">
          <div className="border-b bg-muted/50 px-3 py-2 text-sm font-medium">{block.title}</div>
          <ul className="divide-y text-sm">
            {block.rows.map((row, i) => (
              <li key={i} className="flex justify-between gap-2 px-3 py-2">
                <span className="font-medium text-yeo-700 dark:text-yeo-300">{String(row[dk] ?? "")}</span>
                <span className="truncate text-muted-foreground">
                  {block.columns
                    .filter((c) => c.name !== dk)
                    .map((c) => String(row[c.name] ?? ""))
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case "database_gallery": {
      const ik = block.imageColumn;
      return wrap(
        <div>
          <p className="mb-2 text-sm font-medium">{block.title}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {block.rows.map((row, i) => (
              <div key={i} className="overflow-hidden rounded-lg border bg-card shadow-sm">
                <div className="aspect-video bg-muted text-center text-xs text-muted-foreground flex items-center justify-center">
                  {String(row[ik] ?? "🖼")}
                </div>
                <div className="p-2 text-xs text-muted-foreground">
                  {block.columns
                    .filter((c) => c.name !== ik)
                    .map((c) => `${c.name}: ${String(row[c.name] ?? "")}`)
                    .join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "columns":
      return wrap(
        <div className={cn("grid gap-4", block.layout === "3" ? "md:grid-cols-3" : "md:grid-cols-2")}>
          {block.children.map((col, ci) => (
            <div key={ci} className="space-y-1 rounded-lg border bg-muted/10 p-2">
              {col.map((c) => (
                <BlockRenderer
                  key={c.id}
                  block={c}
                  readOnly={readOnly}
                  onChange={onChange}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  depth={depth}
                />
              ))}
            </div>
          ))}
        </div>
      );
    case "embed":
      return wrap(
        <div className="overflow-hidden rounded-lg border shadow-sm">
          <p className="border-b bg-muted/40 px-3 py-2 text-xs font-medium">{block.title ?? "Embed"}</p>
          <iframe src={block.src} title={block.title ?? "embed"} className="h-64 w-full bg-white" />
        </div>
      );
    default:
      return null;
  }
}
