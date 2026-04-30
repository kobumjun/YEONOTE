"use client";

import type { TemplateBlock } from "@/types/template";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

export function BlockRenderer({
  block,
  readOnly,
  onChange,
  onDelete,
  onDuplicate,
  onEnter,
  depth = 0,
}: {
  block: TemplateBlock;
  readOnly?: boolean;
  onChange?: (id: string, patch: Partial<TemplateBlock>) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onEnter?: (id: string) => void;
  depth?: number;
}) {
  const stopGlobalHotkeys = (e: React.KeyboardEvent<HTMLElement>) => {
    e.stopPropagation();
  };

  const enterCreatesNewBlock = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Enter" || e.shiftKey || readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    onEnter?.(block.id);
  };

  const debugInput = (field: string, value: string) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[editor] block input", {
        id: block.id,
        type: block.type,
        field,
        valuePreview: value.slice(0, 80),
      });
    }
  };

  const wrap = (child: React.ReactNode) => (
    <div className="relative py-1 pl-1" style={{ marginLeft: depth * 12 }}>
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
            value={String(block.content ?? "")}
            onChange={(e) => onChange?.(block.id, { content: e.target.value } as Partial<TemplateBlock>)}
            onInput={(e) => debugInput("content", (e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              stopGlobalHotkeys(e);
              enterCreatesNewBlock(e);
            }}
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
            value={String(block.content ?? "")}
            onChange={(e) => onChange?.(block.id, { content: e.target.value } as Partial<TemplateBlock>)}
            onInput={(e) => debugInput("content", (e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              stopGlobalHotkeys(e);
              enterCreatesNewBlock(e);
            }}
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
            value={String(block.content ?? "")}
            onChange={(e) => onChange?.(block.id, { content: e.target.value } as Partial<TemplateBlock>)}
            onInput={(e) => debugInput("content", (e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              stopGlobalHotkeys(e);
              enterCreatesNewBlock(e);
            }}
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
            rows={Math.max(2, String(block.content ?? "").split("\n").length)}
            value={String(block.content ?? "")}
            onChange={(e) => onChange?.(block.id, { content: e.target.value } as Partial<TemplateBlock>)}
            onInput={(e) => debugInput("content", (e.target as HTMLTextAreaElement).value)}
            onKeyDown={stopGlobalHotkeys}
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
                  value={String(item ?? "")}
                  onChange={(e) => {
                    const next = [...block.items];
                    next[i] = e.target.value;
                    onChange?.(block.id, { items: next } as Partial<TemplateBlock>);
                  }}
                  onKeyDown={(e) => {
                    stopGlobalHotkeys(e);
                    enterCreatesNewBlock(e);
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
                  value={String(item ?? "")}
                  onChange={(e) => {
                    const next = [...block.items];
                    next[i] = e.target.value;
                    onChange?.(block.id, { items: next } as Partial<TemplateBlock>);
                  }}
                  onKeyDown={(e) => {
                    stopGlobalHotkeys(e);
                    enterCreatesNewBlock(e);
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
              value={String(block.content ?? "")}
              onChange={(e) => onChange?.(block.id, { content: e.target.value } as Partial<TemplateBlock>)}
              onInput={(e) => debugInput("content", (e.target as HTMLInputElement).value)}
              onKeyDown={(e) => {
                stopGlobalHotkeys(e);
                enterCreatesNewBlock(e);
              }}
            />
          )}
        </label>
      );
    case "toggle":
      return wrap(
        <details className="rounded-lg border bg-muted/30 px-3 py-2" open>
          <summary className="cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">
            {readOnly ? (
              block.title
            ) : (
              <input
                className="w-full border-0 bg-transparent p-0 font-medium outline-none focus:ring-2 focus:ring-yeo-500/30 rounded"
                value={String(block.title ?? "")}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onChange?.(block.id, { title: e.target.value } as Partial<TemplateBlock>)}
                onInput={(e) => debugInput("title", (e.target as HTMLInputElement).value)}
                onKeyDown={(e) => {
                  stopGlobalHotkeys(e);
                  enterCreatesNewBlock(e);
                }}
              />
            )}
          </summary>
          <div className="mt-2 space-y-1 border-l-2 border-yeo-300 pl-3 dark:border-yeo-700">
            {(Array.isArray(block.children) ? block.children : []).map((c) => (
              <BlockRenderer
                key={c.id}
                block={c}
                readOnly={readOnly}
                onChange={onChange}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onEnter={onEnter}
                depth={depth + 1}
              />
            ))}
            {(Array.isArray(block.children) ? block.children.length : 0) === 0 && (
              <p className="text-xs text-muted-foreground">하위 블록이 없습니다.</p>
            )}
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
              value={String(block.icon ?? "")}
              onChange={(e) => onChange?.(block.id, { icon: e.target.value } as Partial<TemplateBlock>)}
              aria-label="콜아웃 아이콘"
              onKeyDown={stopGlobalHotkeys}
            />
          )}
          <div className="min-w-0 flex-1">
            {readOnly ? (
              <div className="whitespace-pre-wrap">{block.content}</div>
            ) : (
              <textarea
                className="w-full resize-none border-0 bg-transparent p-0 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-yeo-500/30 rounded"
                rows={Math.max(2, String(block.content ?? "").split("\n").length)}
                value={String(block.content ?? "")}
                onChange={(e) => onChange?.(block.id, { content: e.target.value } as Partial<TemplateBlock>)}
                onInput={(e) => debugInput("content", (e.target as HTMLTextAreaElement).value)}
                onKeyDown={stopGlobalHotkeys}
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
            rows={Math.max(2, String(block.content ?? "").split("\n").length)}
            value={String(block.content ?? "")}
            onChange={(e) => onChange?.(block.id, { content: e.target.value } as Partial<TemplateBlock>)}
            onInput={(e) => debugInput("content", (e.target as HTMLTextAreaElement).value)}
            onKeyDown={stopGlobalHotkeys}
          />
        )
      );
    case "divider":
      return wrap(<hr className="my-4 border-t border-border" />);
    case "code":
      return wrap(
        readOnly ? (
          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
            <span className="mb-2 block text-[10px] uppercase text-slate-400">{block.language}</span>
            <code>{block.content}</code>
          </pre>
        ) : (
          <div className="rounded-lg border bg-slate-950/95 p-3">
            <input
              className="mb-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300 outline-none focus:border-yeo-500"
              value={String(block.language ?? "")}
              onChange={(e) => onChange?.(block.id, { language: e.target.value } as Partial<TemplateBlock>)}
              aria-label="코드 언어"
              onKeyDown={stopGlobalHotkeys}
            />
            <textarea
              className="min-h-24 w-full resize-y rounded border border-slate-700 bg-slate-900 p-2 font-mono text-xs text-slate-100 outline-none focus:border-yeo-500"
              value={String(block.content ?? "")}
              onChange={(e) => onChange?.(block.id, { content: e.target.value } as Partial<TemplateBlock>)}
              aria-label="코드 내용"
              onKeyDown={stopGlobalHotkeys}
            />
          </div>
        )
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
        <div className="group/table relative overflow-x-auto rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
            {readOnly ? (
              <p className="text-sm font-medium">{block.title}</p>
            ) : (
              <input
                className="w-full border-0 bg-transparent text-sm font-medium outline-none focus:ring-2 focus:ring-yeo-500/30 rounded"
                value={block.title}
                onChange={(e) => onChange?.(block.id, { title: e.target.value } as Partial<TemplateBlock>)}
              />
            )}
            {!readOnly && (
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded border text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const nextColumns = [...block.columns, { name: `새 열 ${block.columns.length + 1}`, type: "text" as const }];
                  const nextRows = block.rows.map((r) => ({ ...r, [nextColumns[nextColumns.length - 1].name]: "" }));
                  onChange?.(block.id, { columns: nextColumns, rows: nextRows } as Partial<TemplateBlock>);
                }}
                aria-label="열 추가"
                title="열 추가"
              >
                <Plus className="size-4" />
              </button>
            )}
          </div>
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead>
              <tr className="border-b bg-muted/30">
                {block.columns.map((c, ci) => (
                  <th key={`${c.name}-${ci}`} className="px-2 py-2 font-medium">
                    {readOnly ? (
                      c.name
                    ) : (
                      <input
                        className="w-full border-0 bg-transparent text-xs font-medium outline-none focus:ring-2 focus:ring-yeo-500/30 rounded"
                        value={c.name}
                        onChange={(e) => {
                          const prevName = c.name;
                          const nextName = e.target.value || `열 ${ci + 1}`;
                          const nextColumns = [...block.columns];
                          nextColumns[ci] = { ...nextColumns[ci], name: nextName };
                          const nextRows = block.rows.map((row) => {
                            const copy = { ...row };
                            if (prevName !== nextName) {
                              copy[nextName] = copy[prevName];
                              delete copy[prevName];
                            }
                            return copy;
                          });
                          onChange?.(block.id, { columns: nextColumns, rows: nextRows } as Partial<TemplateBlock>);
                        }}
                      />
                    )}
                  </th>
                ))}
                {!readOnly && <th className="w-8 px-1 py-2" />}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="group/row border-b last:border-0">
                  {block.columns.map((c) => {
                    const value = row[c.name];
                    const updateCell = (nextVal: string | number | boolean | null) => {
                      const nextRows = [...block.rows];
                      nextRows[ri] = { ...nextRows[ri], [c.name]: nextVal };
                      onChange?.(block.id, { rows: nextRows } as Partial<TemplateBlock>);
                    };
                    return (
                      <td key={`${ri}-${c.name}`} className="px-2 py-1.5 align-middle">
                        {readOnly ? (
                          c.type === "checkbox" ? (
                            <Checkbox checked={Boolean(value)} disabled />
                          ) : (
                            <span>{String(value ?? "")}</span>
                          )
                        ) : c.type === "checkbox" ? (
                          <Checkbox checked={Boolean(value)} onCheckedChange={(v) => updateCell(Boolean(v))} />
                        ) : c.type === "select" ? (
                          <select
                            className="h-7 w-full rounded border bg-background px-2 text-xs"
                            value={String(value ?? "")}
                            onChange={(e) => updateCell(e.target.value)}
                          >
                            <option value="">선택</option>
                            {(c.options ?? []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : c.type === "date" ? (
                          <input
                            type="date"
                            className="h-7 w-full rounded border bg-background px-2 text-xs"
                            value={typeof value === "string" ? value : ""}
                            onChange={(e) => updateCell(e.target.value)}
                          />
                        ) : c.type === "number" ? (
                          <input
                            type="number"
                            className="h-7 w-full rounded border bg-background px-2 text-xs"
                            value={
                              typeof value === "number"
                                ? String(value)
                                : typeof value === "string"
                                  ? value
                                  : ""
                            }
                            onChange={(e) => updateCell(e.target.value === "" ? null : Number(e.target.value))}
                          />
                        ) : (
                          <input
                            type="text"
                            className="h-7 w-full rounded border bg-background px-2 text-xs"
                            value={String(value ?? "")}
                            onChange={(e) => updateCell(e.target.value)}
                          />
                        )}
                      </td>
                    );
                  })}
                  {!readOnly && (
                    <td className="px-1 py-1.5 align-middle">
                      <button
                        type="button"
                        className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 hover:text-destructive"
                        onClick={() => {
                          const nextRows = block.rows.filter((_, idx) => idx !== ri);
                          onChange?.(block.id, { rows: nextRows } as Partial<TemplateBlock>);
                        }}
                        aria-label="행 삭제"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {block.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={block.columns.length + (readOnly ? 0 : 1)}
                    className="px-2 py-6 text-center text-xs text-muted-foreground"
                  >
                    {readOnly ? "등록된 행이 없습니다." : "아직 행이 없습니다. 아래에서 행을 추가하세요."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {!readOnly && (
            <div className="border-t bg-muted/20 px-2 py-1.5">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => {
                  const nextRow = Object.fromEntries(
                    block.columns.map((c) => [c.name, c.type === "checkbox" ? false : c.type === "number" ? null : ""])
                  );
                  const nextRows = [...block.rows, nextRow];
                  onChange?.(block.id, { rows: nextRows } as Partial<TemplateBlock>);
                }}
              >
                <Plus className="size-3.5" />
                행 추가
              </button>
            </div>
          )}
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
