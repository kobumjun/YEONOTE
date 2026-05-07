"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getEffectiveLinkedSectionId,
  getSelectColumnOptions,
  instantiateDetailTemplate,
  isHiddenMetaDatabaseColumnName,
  isNavigationGuideCalloutContent,
  type DatabaseRow,
  type TemplateBlock,
} from "@/types/template";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

const CONTENT_DEBOUNCE_MS = 1000;

function normalizeSelectOptions(options: string[]): string[] {
  const mapped = options.map((opt) => String(opt ?? "").trim()).filter(Boolean);
  return Array.from(new Set(mapped));
}

/** contentEditable: never sync DOM from props while focused; debounce store updates so parent re-renders do not steal focus. */
function EditableContent({
  value,
  onValueChange,
  className,
  multiline = false,
  onEnter,
  onKeyDown,
  onClick,
  ariaLabel,
}: {
  value: string;
  onValueChange: (next: string) => void;
  className: string;
  multiline?: boolean;
  onEnter?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);
  const lastFlushedRef = useRef(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDebounce = useCallback(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    if (!ref.current) return;
    const text = (ref.current.textContent ?? "").replace(/\u00a0/g, " ");
    if (text !== lastFlushedRef.current) {
      lastFlushedRef.current = text;
      onValueChange(text);
    }
  }, [onValueChange]);

  const scheduleDebouncedSave = useCallback(() => {
    clearDebounce();
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      flush();
    }, CONTENT_DEBOUNCE_MS);
  }, [clearDebounce, flush]);

  useEffect(() => {
    if (!ref.current) return;
    if (isEditingRef.current) return;
    const next = value ?? "";
    if (ref.current.textContent !== next) {
      ref.current.textContent = next;
    }
    lastFlushedRef.current = next;
  }, [value]);

  useEffect(() => () => clearDebounce(), [clearDebounce]);

  const handleFocus = useCallback(() => {
    isEditingRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    clearDebounce();
    flush();
    isEditingRef.current = false;
  }, [clearDebounce, flush]);

  const handleInput = useCallback(() => {
    scheduleDebouncedSave();
  }, [scheduleDebouncedSave]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={ariaLabel}
      className={className}
      onClick={onClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onInput={handleInput}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (!multiline && e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          clearDebounce();
          flush();
          onEnter?.();
        }
      }}
    />
  );
}

/** input/textarea: sync from props only when not focused; debounced + blur commit (avoids controlled-input focus loss). */
function DebouncedTextField({
  value,
  onCommit,
  className,
  multiline,
  inputType = "text",
  ariaLabel,
  onKeyDown,
}: {
  value: string;
  onCommit: (next: string) => void;
  className: string;
  multiline?: boolean;
  inputType?: "text" | "number";
  ariaLabel?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const isEditingRef = useRef(false);
  const lastFlushedRef = useRef(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDebounce = useCallback(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const readDom = useCallback(() => {
    if (multiline) return areaRef.current?.value ?? "";
    return inputRef.current?.value ?? "";
  }, [multiline]);

  const flush = useCallback(() => {
    const text = readDom();
    if (text !== lastFlushedRef.current) {
      lastFlushedRef.current = text;
      onCommit(text);
    }
  }, [onCommit, readDom]);

  const scheduleDebouncedSave = useCallback(() => {
    clearDebounce();
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      flush();
    }, CONTENT_DEBOUNCE_MS);
  }, [clearDebounce, flush]);

  useEffect(() => {
    if (isEditingRef.current) return;
    const next = value ?? "";
    if (multiline) {
      const el = areaRef.current;
      if (el && el.value !== next) {
        el.value = next;
        lastFlushedRef.current = next;
      }
    } else {
      const el = inputRef.current;
      if (el && el.value !== next) {
        el.value = next;
        lastFlushedRef.current = next;
      }
    }
  }, [value, multiline]);

  useEffect(() => () => clearDebounce(), [clearDebounce]);

  const bind = {
    className,
    defaultValue: value,
    "aria-label": ariaLabel,
    onFocus: () => {
      isEditingRef.current = true;
    },
    onBlur: () => {
      clearDebounce();
      flush();
      isEditingRef.current = false;
    },
    onInput: () => {
      scheduleDebouncedSave();
    },
    onKeyDown,
  };

  if (multiline) {
    return <textarea ref={areaRef} {...bind} />;
  }
  return <input ref={inputRef} type={inputType} {...bind} />;
}

export function BlockRenderer({
  block,
  readOnly,
  onChange,
  onDelete,
  onDuplicate,
  onEnter,
  onOpenTableRowDetail,
  onOpenNestedPage,
  depth = 0,
}: {
  block: TemplateBlock;
  readOnly?: boolean;
  onChange?: (id: string, patch: Partial<TemplateBlock>) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onEnter?: (id: string) => void;
  /** Master database_table row → full-page detail (linked blocks or shared detailTemplate). */
  onOpenTableRowDetail?: (ctx: {
    parentTableBlockId: string;
    row: DatabaseRow;
    rowTitle: string;
    source: "linked" | "template";
  }) => void;
  onOpenNestedPage?: (ctx: { id: string; title: string; blocks: TemplateBlock[] }) => void;
  depth?: number;
}) {
  const [calendarYm, setCalendarYm] = useState<{ year: number; month: number } | null>(null);
  useEffect(() => {
    if (block.type !== "monthly_calendar") return;
    setCalendarYm({ year: block.year, month: block.month });
  }, [block]);

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
    <div
      id={`yeo-block-${block.id}`}
      data-yeo-block-id={block.id}
      className="relative scroll-mt-28 py-1 pl-1"
      style={{ marginLeft: depth * 12 }}
    >
      {child}
    </div>
  );

  const tryOpenTableRowDetail = (row: DatabaseRow) => {
    if (block.type !== "database_table" || !onOpenTableRowDetail) return;
    const cols = block.columns;
    const key0 = cols.find((c) => !isHiddenMetaDatabaseColumnName(c.name))?.name;
    const rowTitle = key0 ? String(row[key0] ?? "").trim() : "";
    const linked = getEffectiveLinkedSectionId(row, cols)?.trim();
    const hasTemplate = (block.detailTemplate?.blocks?.length ?? 0) > 0;
    if (linked) {
      onOpenTableRowDetail({
        parentTableBlockId: block.id,
        row,
        rowTitle: rowTitle || "Detail",
        source: "linked",
      });
      return;
    }
    if (hasTemplate) {
      onOpenTableRowDetail({
        parentTableBlockId: block.id,
        row,
        rowTitle: rowTitle || "Item",
        source: "template",
      });
    }
  };

  const handleLinkedRowActivate = (e: React.MouseEvent | React.KeyboardEvent, row: DatabaseRow) => {
    if (block.type !== "database_table") return;
    const linked = getEffectiveLinkedSectionId(row, block.columns)?.trim();
    const hasTemplate = (block.detailTemplate?.blocks?.length ?? 0) > 0;
    if ((!linked && !hasTemplate) || !onOpenTableRowDetail) return;
    const el = e.target as HTMLElement | null;
    if (el?.closest("button, input, select, textarea, a, [contenteditable='true']")) return;
    tryOpenTableRowDetail(row);
  };

  switch (block.type) {
    case "heading1":
      return wrap(
        readOnly ? (
          <h2 className="font-heading text-3xl font-bold text-surface-dark dark:text-white">{block.content}</h2>
        ) : (
          <EditableContent
            ariaLabel="Heading 1"
            className="font-heading w-full rounded-md bg-transparent px-0.5 text-3xl font-bold text-surface-dark outline-none focus:ring-2 focus:ring-yeo-500/30 dark:text-white"
            value={String(block.content ?? "")}
            onValueChange={(value) => {
              onChange?.(block.id, { content: value } as Partial<TemplateBlock>);
              debugInput("content", value);
            }}
            onEnter={() => onEnter?.(block.id)}
            onKeyDown={stopGlobalHotkeys}
          />
        )
      );
    case "heading2":
      return wrap(
        readOnly ? (
          <h3 className="font-heading text-2xl font-semibold text-surface-dark dark:text-white">{block.content}</h3>
        ) : (
          <EditableContent
            ariaLabel="Heading 2"
            className="font-heading w-full rounded-md bg-transparent px-0.5 text-2xl font-semibold text-surface-dark outline-none focus:ring-2 focus:ring-yeo-500/30 dark:text-white"
            value={String(block.content ?? "")}
            onValueChange={(value) => {
              onChange?.(block.id, { content: value } as Partial<TemplateBlock>);
              debugInput("content", value);
            }}
            onEnter={() => onEnter?.(block.id)}
            onKeyDown={stopGlobalHotkeys}
          />
        )
      );
    case "heading3":
      return wrap(
        readOnly ? (
          <h4 className="font-heading text-xl font-semibold text-surface-dark dark:text-white">{block.content}</h4>
        ) : (
          <EditableContent
            ariaLabel="Heading 3"
            className="font-heading w-full rounded-md bg-transparent px-0.5 text-xl font-semibold text-surface-dark outline-none focus:ring-2 focus:ring-yeo-500/30 dark:text-white"
            value={String(block.content ?? "")}
            onValueChange={(value) => {
              onChange?.(block.id, { content: value } as Partial<TemplateBlock>);
              debugInput("content", value);
            }}
            onEnter={() => onEnter?.(block.id)}
            onKeyDown={stopGlobalHotkeys}
          />
        )
      );
    case "paragraph":
      return wrap(
        readOnly ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{block.content}</p>
        ) : (
          <EditableContent
            ariaLabel="Paragraph"
            multiline
            className="w-full min-h-8 whitespace-pre-wrap rounded-md bg-transparent p-1 text-sm leading-relaxed outline-none ring-0 focus:ring-2 focus:ring-yeo-500/30"
            value={String(block.content ?? "")}
            onValueChange={(value) => {
              onChange?.(block.id, { content: value } as Partial<TemplateBlock>);
              debugInput("content", value);
            }}
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
                <EditableContent
                  ariaLabel={`Bullet item ${i + 1}`}
                  className="min-w-0 flex-1 rounded bg-transparent p-0.5 text-sm outline-none focus:ring-2 focus:ring-yeo-500/30"
                  value={String(item ?? "")}
                  onValueChange={(value) => {
                    const next = [...block.items];
                    next[i] = value;
                    onChange?.(block.id, { items: next } as Partial<TemplateBlock>);
                    debugInput("items", value);
                  }}
                  onEnter={() => onEnter?.(block.id)}
                  onKeyDown={stopGlobalHotkeys}
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
                <EditableContent
                  ariaLabel={`Numbered item ${i + 1}`}
                  className="min-w-0 flex-1 rounded bg-transparent p-0.5 text-sm outline-none focus:ring-2 focus:ring-yeo-500/30"
                  value={String(item ?? "")}
                  onValueChange={(value) => {
                    const next = [...block.items];
                    next[i] = value;
                    onChange?.(block.id, { items: next } as Partial<TemplateBlock>);
                    debugInput("items", value);
                  }}
                  onEnter={() => onEnter?.(block.id)}
                  onKeyDown={stopGlobalHotkeys}
                />
              </li>
            ))}
          </ol>
        )
      );
    case "to_do":
      return wrap(
        <div className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={block.checked}
            disabled={readOnly}
            onCheckedChange={(v) => onChange?.(block.id, { checked: Boolean(v) } as Partial<TemplateBlock>)}
            className="mt-0.5"
          />
          {readOnly ? (
            <span className={block.checked ? "text-muted-foreground line-through" : ""}>{block.content}</span>
          ) : (
            <EditableContent
              ariaLabel="To-do content"
              className="flex-1 rounded bg-transparent p-0.5 text-sm outline-none focus:ring-2 focus:ring-yeo-500/30"
              value={String(block.content ?? "")}
              onValueChange={(value) => {
                onChange?.(block.id, { content: value } as Partial<TemplateBlock>);
                debugInput("content", value);
              }}
              onEnter={() => onEnter?.(block.id)}
              onKeyDown={stopGlobalHotkeys}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      );
    case "checklist":
      return wrap(
        <ul className="list-none space-y-1.5 text-sm">
          {block.items.map((item, i) => (
            <li key={i} className="group/item flex items-start gap-2">
              <Checkbox
                checked={item.checked}
                disabled={readOnly}
                onCheckedChange={(v) => {
                  const next = [...block.items];
                  next[i] = { ...next[i], checked: Boolean(v) };
                  onChange?.(block.id, { items: next } as Partial<TemplateBlock>);
                }}
                className="mt-0.5"
              />
              {readOnly ? (
                <span className={item.checked ? "text-muted-foreground line-through" : ""}>{item.content}</span>
              ) : (
                <>
                  <EditableContent
                    ariaLabel={`Checklist item ${i + 1}`}
                    className="min-w-0 flex-1 rounded bg-transparent p-0.5 text-sm outline-none focus:ring-2 focus:ring-yeo-500/30"
                    value={String(item.content ?? "")}
                    onValueChange={(value) => {
                      const next = [...block.items];
                      next[i] = { ...next[i], content: value };
                      onChange?.(block.id, { items: next } as Partial<TemplateBlock>);
                      debugInput("checklist", value);
                    }}
                    onEnter={() => onEnter?.(block.id)}
                    onKeyDown={stopGlobalHotkeys}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {item.detailTemplate?.blocks?.length && onOpenNestedPage ? (
                    <button
                      type="button"
                      className="ml-auto rounded p-1 text-muted-foreground/30 opacity-0 transition-all group-hover/item:bg-muted group-hover/item:text-muted-foreground group-hover/item:opacity-100"
                      aria-label="Checklist detail page"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNestedPage({
                          id: `${block.id}-check-${i}`,
                          title: item.content || "Detail",
                          blocks: instantiateDetailTemplate(item.detailTemplate!, item.content || "Detail"),
                        });
                      }}
                    >
                      <ChevronRight className="size-4" aria-hidden />
                    </button>
                  ) : null}
                </>
              )}
            </li>
          ))}
        </ul>
      );
    case "toggle":
      return wrap(
        <details className="rounded-lg border bg-muted/30 px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium">
            {readOnly ? (
              block.title
            ) : (
              <EditableContent
                ariaLabel="Toggle title"
                className="inline-block min-w-[10ch] rounded px-1 py-0.5 font-medium outline-none focus:ring-2 focus:ring-yeo-500/30"
                value={String(block.title ?? "")}
                onValueChange={(value) => {
                  onChange?.(block.id, { title: value } as Partial<TemplateBlock>);
                  debugInput("title", value);
                }}
                onEnter={() => onEnter?.(block.id)}
                onKeyDown={(e) => {
                  stopGlobalHotkeys(e);
                  enterCreatesNewBlock(e);
                }}
                onClick={(e) => e.stopPropagation()}
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
                onOpenTableRowDetail={onOpenTableRowDetail}
                onOpenNestedPage={onOpenNestedPage}
                depth={depth + 1}
              />
            ))}
            {(Array.isArray(block.children) ? block.children.length : 0) === 0 && (
              <p className="text-xs text-muted-foreground">No blocks inside yet.</p>
            )}
          </div>
        </details>
      );
    case "sub_page":
      return wrap(
        <details className="rounded-xl border-2 border-yeo-200/90 bg-card shadow-sm dark:border-yeo-800/70">
          <summary className="cursor-pointer list-none px-3 py-2 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 text-sm font-medium">
              {readOnly ? (
                <>
                  {block.icon ? <span className="text-lg leading-none">{block.icon}</span> : null}
                  <span>{block.title}</span>
                  <span className="text-[10px] font-normal uppercase tracking-wide text-muted-foreground">Sub-page</span>
                </>
              ) : (
                <>
                  <DebouncedTextField
                    className="w-10 shrink-0 border-0 bg-transparent text-center text-lg outline-none"
                    value={String(block.icon ?? "")}
                    onCommit={(v) => onChange?.(block.id, { icon: v } as Partial<TemplateBlock>)}
                    ariaLabel="Sub-page icon"
                    onKeyDown={stopGlobalHotkeys}
                  />
                  <EditableContent
                    ariaLabel="Sub-page title"
                    className="inline-block min-w-[12ch] flex-1 rounded px-1 py-0.5 font-medium outline-none focus:ring-2 focus:ring-yeo-500/30"
                    value={String(block.title ?? "")}
                    onValueChange={(value) => {
                      onChange?.(block.id, { title: value } as Partial<TemplateBlock>);
                      debugInput("title", value);
                    }}
                    onEnter={() => onEnter?.(block.id)}
                    onKeyDown={(e) => {
                      stopGlobalHotkeys(e);
                      enterCreatesNewBlock(e);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="hidden text-[10px] font-normal uppercase tracking-wide text-muted-foreground sm:inline">
                    Sub-page
                  </span>
                </>
              )}
            </span>
          </summary>
          <div className="space-y-1 border-t border-border/60 px-3 py-2">
            <div className="space-y-1 border-l-2 border-yeo-400/70 pl-3 dark:border-yeo-600">
              {(Array.isArray(block.children) ? block.children : []).map((c) => (
                <BlockRenderer
                  key={c.id}
                  block={c}
                  readOnly={readOnly}
                  onChange={onChange}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onEnter={onEnter}
                  onOpenTableRowDetail={onOpenTableRowDetail}
                onOpenNestedPage={onOpenNestedPage}
                  depth={depth + 1}
                />
              ))}
              {(Array.isArray(block.children) ? block.children.length : 0) === 0 && (
                <p className="text-xs text-muted-foreground">Add detail blocks inside when expanded.</p>
              )}
            </div>
          </div>
        </details>
      );
    case "linked_page":
      return wrap(
        <div className="overflow-hidden rounded-xl border-2 border-dashed border-yeo-300/80 bg-gradient-to-br from-card to-muted/30 dark:border-yeo-700/60">
          <div className="flex flex-col gap-2 border-b border-border/70 px-3 py-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              {readOnly ? (
                block.icon ? (
                  <span className="text-lg leading-none">{block.icon}</span>
                ) : null
              ) : (
                <DebouncedTextField
                  className="w-10 shrink-0 border-0 bg-transparent text-center text-lg outline-none"
                  value={String(block.icon ?? "")}
                  onCommit={(v) => onChange?.(block.id, { icon: v } as Partial<TemplateBlock>)}
                  ariaLabel="Linked page icon"
                  onKeyDown={stopGlobalHotkeys}
                />
              )}
              <div className="min-w-0 flex-1">
                {readOnly ? (
                  <div className="font-medium">
                    {block.url ? (
                      <a
                        href={block.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-yeo-700 underline-offset-2 hover:underline dark:text-yeo-300"
                      >
                        {block.title || block.url}
                      </a>
                    ) : (
                      block.title
                    )}
                  </div>
                ) : (
                  <EditableContent
                    ariaLabel="Linked page title"
                    className="w-full rounded px-0.5 py-0.5 text-sm font-medium outline-none focus:ring-2 focus:ring-yeo-500/30"
                    value={String(block.title ?? "")}
                    onValueChange={(value) => {
                      onChange?.(block.id, { title: value } as Partial<TemplateBlock>);
                      debugInput("title", value);
                    }}
                    onKeyDown={stopGlobalHotkeys}
                  />
                )}
                {readOnly ? (
                  block.description ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{block.description}</p>
                  ) : null
                ) : (
                  <EditableContent
                    ariaLabel="Short description"
                    multiline
                    className="mt-1 min-h-6 w-full whitespace-pre-wrap rounded p-0.5 text-xs text-muted-foreground outline-none focus:ring-2 focus:ring-yeo-500/30"
                    value={String(block.description ?? "")}
                    onValueChange={(value) => {
                      onChange?.(block.id, { description: value } as Partial<TemplateBlock>);
                      debugInput("description", value);
                    }}
                    onKeyDown={stopGlobalHotkeys}
                  />
                )}
              </div>
            </div>
            {!readOnly && (
              <DebouncedTextField
                className="w-full shrink-0 rounded border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-yeo-500/30 sm:max-w-[240px]"
                value={String(block.url ?? "")}
                onCommit={(v) => onChange?.(block.id, { url: v } as Partial<TemplateBlock>)}
                ariaLabel="External URL (optional, https://...)"
                onKeyDown={stopGlobalHotkeys}
              />
            )}
            {readOnly && block.url ? (
              <span className="truncate text-xs text-muted-foreground sm:max-w-[200px]">{block.url}</span>
            ) : null}
          </div>
          <div className="space-y-1 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Inner content</p>
            <div className="space-y-1 border-l-2 border-yeo-500/40 pl-3 dark:border-yeo-500/60">
              {(Array.isArray(block.children) ? block.children : []).map((c) => (
                <BlockRenderer
                  key={c.id}
                  block={c}
                  readOnly={readOnly}
                  onChange={onChange}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onEnter={onEnter}
                  onOpenTableRowDetail={onOpenTableRowDetail}
                onOpenNestedPage={onOpenNestedPage}
                  depth={depth + 1}
                />
              ))}
              {(Array.isArray(block.children) ? block.children.length : 0) === 0 && (
                <p className="text-xs text-muted-foreground">Place detail tables, checklists, and paragraphs here.</p>
              )}
            </div>
          </div>
        </div>
      );
    case "callout":
      if (isNavigationGuideCalloutContent(block.content)) {
        return null;
      }
      return wrap(
        <div className="flex gap-3 rounded-lg border border-yeo-200 bg-yeo-50/90 p-4 text-sm dark:border-yeo-800 dark:bg-yeo-950/50">
          {readOnly ? (
            <span className="text-lg">{block.icon}</span>
          ) : (
            <DebouncedTextField
              className="w-10 shrink-0 border-0 bg-transparent text-center text-lg outline-none"
              value={String(block.icon ?? "")}
              onCommit={(v) => onChange?.(block.id, { icon: v } as Partial<TemplateBlock>)}
              aria-label="Callout icon"
              onKeyDown={stopGlobalHotkeys}
            />
          )}
          <div className="min-w-0 flex-1">
            {readOnly ? (
              <div className="whitespace-pre-wrap">{block.content}</div>
            ) : (
              <EditableContent
                ariaLabel="Callout content"
                multiline
                className="min-h-7 w-full whitespace-pre-wrap rounded p-0.5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-yeo-500/30"
                value={String(block.content ?? "")}
                onValueChange={(value) => {
                  onChange?.(block.id, { content: value } as Partial<TemplateBlock>);
                  debugInput("content", value);
                }}
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
          <EditableContent
            ariaLabel="Quote"
            multiline
            className="w-full min-h-8 whitespace-pre-wrap rounded-r border-l-4 border-yeo-400 bg-transparent pl-4 text-sm italic text-muted-foreground outline-none focus:ring-2 focus:ring-yeo-500/30"
            value={String(block.content ?? "")}
            onValueChange={(value) => {
              onChange?.(block.id, { content: value } as Partial<TemplateBlock>);
              debugInput("content", value);
            }}
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
            <DebouncedTextField
              className="mb-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300 outline-none focus:border-yeo-500"
              value={String(block.language ?? "")}
              onCommit={(v) => onChange?.(block.id, { language: v } as Partial<TemplateBlock>)}
              aria-label="Code language"
              onKeyDown={stopGlobalHotkeys}
            />
            <DebouncedTextField
              className="min-h-24 w-full resize-y rounded border border-slate-700 bg-slate-900 p-2 font-mono text-xs text-slate-100 outline-none focus:border-yeo-500"
              value={String(block.content ?? "")}
              onCommit={(v) => onChange?.(block.id, { content: v } as Partial<TemplateBlock>)}
              multiline
              aria-label="Code content"
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
            <div className="py-8 text-sm text-muted-foreground">Image placeholder</div>
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
    case "database_table": {
      const visibleColCount = block.columns.filter((c) => !isHiddenMetaDatabaseColumnName(c.name)).length;
      const hasDetailTemplate = (block.detailTemplate?.blocks?.length ?? 0) > 0;
      const showLinkColumn =
        Boolean(onOpenTableRowDetail) &&
        (hasDetailTemplate || block.rows.some((r) => getEffectiveLinkedSectionId(r, block.columns)));
      const colSpanEmpty = visibleColCount + (showLinkColumn ? 1 : 0) + (!readOnly ? 1 : 0);
      return wrap(
        <div className="group/table relative overflow-x-auto rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
            {readOnly ? (
              <p className="text-sm font-medium">{block.title}</p>
            ) : (
              <DebouncedTextField
                className="w-full border-0 bg-transparent text-sm font-medium outline-none focus:ring-2 focus:ring-yeo-500/30 rounded"
                value={block.title}
                onCommit={(v) => onChange?.(block.id, { title: v } as Partial<TemplateBlock>)}
                aria-label="Table title"
              />
            )}
            {!readOnly && (
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded border text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const nextColumns = [...block.columns, { name: `Column ${block.columns.length + 1}`, type: "text" as const }];
                  const nextRows = block.rows.map((r) => ({ ...r, [nextColumns[nextColumns.length - 1].name]: "" }));
                  onChange?.(block.id, { columns: nextColumns, rows: nextRows } as Partial<TemplateBlock>);
                }}
                aria-label="Add column"
                title="Add column"
              >
                <Plus className="size-4" />
              </button>
            )}
          </div>
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead>
              <tr className="border-b bg-muted/30">
                {block.columns.map((c, ci) =>
                  isHiddenMetaDatabaseColumnName(c.name) ? null : (
                  <th key={`col-h-${ci}`} className="px-2 py-2 font-medium">
                    {readOnly ? (
                      c.name
                    ) : (
                      <DebouncedTextField
                        className="w-full border-0 bg-transparent text-xs font-medium outline-none focus:ring-2 focus:ring-yeo-500/30 rounded"
                        value={c.name}
                        onCommit={(nextNameRaw) => {
                          const prevName = c.name;
                          const nextName = nextNameRaw || `Column ${ci + 1}`;
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
                        aria-label={`Column name ${ci + 1}`}
                      />
                    )}
                  </th>
                  )
                )}
                {showLinkColumn ? (
                  <th className="w-10 px-1 py-2 text-center font-normal text-muted-foreground" aria-hidden />
                ) : null}
                {!readOnly && <th className="w-8 px-1 py-2" />}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => {
                const linkId = getEffectiveLinkedSectionId(row, block.columns)?.trim();
                const rowCanOpen =
                  Boolean(onOpenTableRowDetail) &&
                  (hasDetailTemplate || Boolean(linkId));
                const rowNavActive = rowCanOpen;
                return (
                  <tr
                    key={ri}
                    className={cn(
                      "group/row border-b last:border-0",
                      rowNavActive && "cursor-pointer hover:bg-muted/60 transition-colors duration-150"
                    )}
                    {...(rowNavActive
                      ? {
                          role: "button" as const,
                          tabIndex: 0,
                          title: "Open detail page",
                          onClick: (e: React.MouseEvent<HTMLTableRowElement>) => handleLinkedRowActivate(e, row),
                          onKeyDown: (e: React.KeyboardEvent<HTMLTableRowElement>) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleLinkedRowActivate(e, row);
                            }
                          },
                        }
                      : {})}
                  >
                    {block.columns.map((c, ci) => {
                      if (isHiddenMetaDatabaseColumnName(c.name)) return null;
                      const value = row[c.name];
                      const normalizedValue = typeof value === "string" ? String(value).trim() : value;
                      const updateCell = (nextVal: string | number | boolean | null) => {
                        const nextRows = [...block.rows];
                        nextRows[ri] = { ...nextRows[ri], [c.name]: nextVal };
                        onChange?.(block.id, { rows: nextRows } as Partial<TemplateBlock>);
                      };
                      return (
                        <td
                          key={`${ri}-col-${ci}`}
                          className="px-2 py-1.5 align-middle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {readOnly ? (
                            c.type === "checkbox" ? (
                              <Checkbox checked={Boolean(value)} disabled />
                            ) : (
                              <span>{String(normalizedValue ?? "")}</span>
                            )
                          ) : c.type === "checkbox" ? (
                            <Checkbox checked={Boolean(value)} onCheckedChange={(v) => updateCell(Boolean(v))} />
                          ) : c.type === "select" ? (
                            (() => {
                              const normalizedOptions = normalizeSelectOptions(getSelectColumnOptions(c));
                              const currentValue = typeof normalizedValue === "string" ? normalizedValue : "";
                              const renderOptions =
                                currentValue && !normalizedOptions.includes(currentValue)
                                  ? [currentValue, ...normalizedOptions]
                                  : normalizedOptions;
                              return (
                            <select
                              className="h-7 w-full rounded border bg-background px-2 text-xs"
                                  value={currentValue}
                                  onChange={(e) => updateCell(e.target.value)}
                            >
                              <option value="">Select</option>
                                  {renderOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                              );
                            })()
                          ) : c.type === "date" ? (
                            <input
                              type="date"
                              className="h-7 w-full rounded border bg-background px-2 text-xs"
                              value={typeof value === "string" ? value : ""}
                              onChange={(e) => updateCell(e.target.value)}
                            />
                          ) : c.type === "number" ? (
                            <DebouncedTextField
                              className="h-7 w-full rounded border bg-background px-2 text-xs"
                              inputType="number"
                              value={
                                typeof value === "number"
                                  ? String(value)
                                  : typeof value === "string"
                                    ? value
                                    : ""
                              }
                              onCommit={(text) => updateCell(text === "" ? null : Number(text))}
                              aria-label={c.name}
                            />
                          ) : (
                            <DebouncedTextField
                              className="h-7 w-full rounded border bg-background px-2 text-xs"
                              value={String(value ?? "")}
                              onCommit={(text) => updateCell(text)}
                              aria-label={c.name}
                            />
                          )}
                        </td>
                      );
                    })}
                    {showLinkColumn ? (
                      <td className="px-2 py-1.5 text-center align-middle">
                        {rowCanOpen ? (
                          <button
                            type="button"
                            className="inline-flex rounded-md p-1 text-muted-foreground/40 transition-all duration-150 group-hover/row:bg-muted group-hover/row:text-muted-foreground"
                            aria-label="Detail page"
                            onClick={(e) => {
                              e.stopPropagation();
                              tryOpenTableRowDetail(row);
                            }}
                          >
                            <ChevronRight className="size-4" aria-hidden />
                          </button>
                        ) : null}
                      </td>
                    ) : null}
                    {!readOnly && (
                      <td className="px-1 py-1.5 align-middle" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 hover:text-destructive"
                          onClick={() => {
                            const nextRows = block.rows.filter((_, idx) => idx !== ri);
                            onChange?.(block.id, { rows: nextRows } as Partial<TemplateBlock>);
                          }}
                          aria-label="Delete row"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {block.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={colSpanEmpty}
                    className="px-2 py-6 text-center text-xs text-muted-foreground"
                  >
                    {readOnly ? "No rows yet." : "No rows yet. Add one below."}
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
                  ) as DatabaseRow;
                  const nextRows = [...block.rows, nextRow];
                  onChange?.(block.id, { rows: nextRows } as Partial<TemplateBlock>);
                }}
              >
                <Plus className="size-3.5" />
                + Add row
              </button>
            </div>
          )}
        </div>
      );
    }
    case "database_board": {
      const colKey = block.groupBy;
      const groups = new Map<string, typeof block.rows>();
      for (const row of block.rows) {
        const k = String(row[colKey] ?? "Other");
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
    case "monthly_calendar": {
      const today = new Date();
      const y = calendarYm?.year ?? block.year;
      const m = calendarYm?.month ?? block.month;
      const firstDow = new Date(y, m - 1, 1).getDay();
      const daysInMonth = new Date(y, m, 0).getDate();
      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const goMonth = (delta: -1 | 1) => {
        const d = new Date(y, m - 1 + delta, 1);
        const next = { year: d.getFullYear(), month: d.getMonth() + 1 };
        setCalendarYm(next);
        if (!readOnly) onChange?.(block.id, next as Partial<TemplateBlock>);
      };
      const openDay = (day: number) => {
        if (!onOpenNestedPage || !block.dayDetailTemplate?.blocks?.length) return;
        const dayName = weekdays[new Date(y, m - 1, day).getDay()];
        const monthName = new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long" });
        const dayTitle = `${monthName} ${day} (${dayName})`;
        onOpenNestedPage({
          id: `${block.id}-day-${y}-${m}-${day}`,
          title: dayTitle,
          blocks: instantiateDetailTemplate(block.dayDetailTemplate, dayTitle),
        });
      };
      return wrap(
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            {readOnly ? (
              <p className="text-sm font-medium">{block.title || "Monthly Calendar"}</p>
            ) : (
              <DebouncedTextField
                className="w-full rounded border-0 bg-transparent text-sm font-medium outline-none focus:ring-2 focus:ring-yeo-500/30"
                value={block.title || ""}
                onCommit={(v) => onChange?.(block.id, { title: v } as Partial<TemplateBlock>)}
                ariaLabel="Calendar title"
              />
            )}
          </div>
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => goMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <h3 className="text-sm font-semibold">
              {new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <button
              type="button"
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => goMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7">
            {weekdays.map((wd, idx) => (
              <div
                key={wd}
                className={cn(
                  "py-1 text-center text-xs font-medium",
                  idx === 0 ? "text-red-400" : idx === 6 ? "text-blue-400" : "text-muted-foreground"
                )}
              >
                {wd}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayData = block.days?.[String(day)];
              const dayOfWeek = (firstDow + i) % 7;
              const isToday =
                today.getFullYear() === y && today.getMonth() + 1 === m && today.getDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  className={cn(
                    "relative m-0.5 flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors hover:bg-muted",
                    isToday && "ring-2 ring-yeo-400",
                    dayData?.checked && "bg-yeo-50 dark:bg-yeo-900/30",
                    dayOfWeek === 0 && "text-red-500",
                    dayOfWeek === 6 && "text-blue-500"
                  )}
                  onClick={() => openDay(day)}
                >
                  <span className="font-medium">{day}</span>
                  {dayData?.checked || dayData?.hasContent ? (
                    <span className="mt-0.5 size-1.5 rounded-full bg-yeo-500" />
                  ) : null}
                </button>
              );
            })}
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
                  onEnter={onEnter}
                  onOpenTableRowDetail={onOpenTableRowDetail}
                  onOpenNestedPage={onOpenNestedPage}
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
          <iframe src={block.src} title={block.title ?? "Embed"} className="h-64 w-full bg-white" />
        </div>
      );
    default:
      return null;
  }
}
