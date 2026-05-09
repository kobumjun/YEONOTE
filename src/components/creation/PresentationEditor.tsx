"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import type { PresentationSlide, SlideElement } from "@/types/template";
import { slideElementToPlainText } from "@/types/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function freshElement(kind: SlideElement["type"]): SlideElement {
  switch (kind) {
    case "bullet_list":
      return { type: "bullet_list", items: ["New point"] };
    case "numbered_list":
      return { type: "numbered_list", items: ["First item"] };
    case "text":
      return { type: "text", content: "" };
    case "heading":
      return { type: "heading", content: "" };
    case "image":
      return { type: "image", url: "", alt: "" };
    case "callout":
      return { type: "callout", content: "" };
    case "quote":
      return { type: "quote", content: "" };
    case "divider":
      return { type: "divider" };
    case "table":
      return {
        type: "table",
        headers: ["Column 1", "Column 2", "Column 3"],
        rows: [
          ["", "", ""],
          ["", "", ""],
        ],
      };
    case "stat_box":
      return {
        type: "stat_box",
        stats: [
          { value: "0", label: "Metric" },
          { value: "0", label: "Metric" },
        ],
      };
    case "timeline":
      return {
        type: "timeline",
        items: [
          { title: "Phase 1", description: "" },
          { title: "Phase 2", description: "" },
          { title: "Phase 3", description: "" },
        ],
      };
    case "two_column":
      return {
        type: "two_column",
        left: "",
        right: "",
      };
  }
}

function SlideElementEditor({
  element,
  readOnly,
  onChange,
  onDelete,
}: {
  element: SlideElement;
  readOnly?: boolean;
  onChange: (next: SlideElement) => void;
  onDelete: () => void;
}) {
  const removeBtn = !readOnly && (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="absolute right-0 top-0 size-8 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
      aria-label="Remove element"
      onClick={onDelete}
    >
      <Trash2 className="size-4 stroke-[1.5]" />
    </Button>
  );

  if (element.type === "bullet_list") {
    const items = element.items.length > 0 ? element.items : [""];
    return (
      <div className="group relative min-w-0 max-w-full break-words pr-8">
        {removeBtn}
        <ul className="min-w-0 max-w-full list-disc space-y-1.5 pl-5 marker:text-foreground">
          {items.map((item, idx) => (
            <li key={idx} className="min-w-0 max-w-full pl-0.5">
              <input
                value={item}
                readOnly={readOnly}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = e.target.value;
                  onChange({ ...element, items: next });
                }}
                className="w-full min-w-0 max-w-full border-0 bg-transparent p-0 text-sm outline-none focus-visible:ring-0 break-words"
                placeholder="Bullet"
              />
            </li>
          ))}
        </ul>
        {!readOnly && (
          <button
            type="button"
            className="mt-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onChange({ ...element, items: [...items, ""] })}
          >
            + Add bullet
          </button>
        )}
      </div>
    );
  }

  if (element.type === "numbered_list") {
    const items = element.items.length > 0 ? element.items : [""];
    return (
      <div className="group relative min-w-0 max-w-full break-words pr-8">
        {removeBtn}
        <ol className="min-w-0 max-w-full space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex min-w-0 max-w-full items-start gap-2">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#6C5CE7] text-[11px] font-semibold text-white">
                {idx + 1}
              </span>
              <input
                value={item}
                readOnly={readOnly}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = e.target.value;
                  onChange({ ...element, items: next });
                }}
                className="w-full min-w-0 max-w-full border-0 bg-transparent p-0 pt-0.5 text-sm outline-none focus-visible:ring-0 break-words"
                placeholder="Item"
              />
            </li>
          ))}
        </ol>
        {!readOnly && (
          <button
            type="button"
            className="mt-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onChange({ ...element, items: [...items, ""] })}
          >
            + Add item
          </button>
        )}
      </div>
    );
  }

  if (element.type === "divider") {
    return (
      <div className="group relative min-w-0 max-w-full pr-8">
        {removeBtn}
        <hr className="max-w-full border-[#E5E7EB]" />
      </div>
    );
  }

  if (element.type === "table") {
    const headers = element.headers.length ? element.headers : ["Column 1", "Column 2"];
    const rows = element.rows.length ? element.rows : [["", ""]];
    const patchHeader = (idx: number, value: string) => {
      const next = [...headers];
      next[idx] = value;
      onChange({ ...element, headers: next, rows: rows.map((r) => (r.length < next.length ? [...r, ...Array(next.length - r.length).fill("")] : r.slice(0, next.length))) });
    };
    const patchCell = (rowIdx: number, colIdx: number, value: string) => {
      const next = rows.map((r) => [...r]);
      next[rowIdx]![colIdx] = value;
      onChange({ ...element, headers, rows: next });
    };
    const addColumn = () => {
      const nextHeaders = [...headers, `Column ${headers.length + 1}`];
      const nextRows = rows.map((r) => [...r, ""]);
      onChange({ ...element, headers: nextHeaders, rows: nextRows });
    };
    const removeColumn = () => {
      if (headers.length <= 1) return;
      const nextHeaders = headers.slice(0, -1);
      const nextRows = rows.map((r) => r.slice(0, -1));
      onChange({ ...element, headers: nextHeaders, rows: nextRows });
    };
    const addRow = () => {
      onChange({ ...element, headers, rows: [...rows, Array(headers.length).fill("")] });
    };
    const removeRow = () => {
      if (rows.length <= 1) return;
      onChange({ ...element, headers, rows: rows.slice(0, -1) });
    };
    return (
      <div className="group relative min-w-0 max-w-full pr-8">
        {removeBtn}
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#6C5CE7] text-white">
                {headers.map((h, i) => (
                  <th key={i} className="border-r border-white/20 p-0 text-left align-middle last:border-r-0">
                    <input
                      value={h}
                      readOnly={readOnly}
                      onChange={(e) => patchHeader(i, e.target.value)}
                      className="w-full bg-transparent px-4 py-2.5 text-[13px] font-semibold outline-none placeholder:text-white/70"
                      placeholder={`Header ${i + 1}`}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-[#FAFAFA]" : "bg-white"}>
                  {headers.map((_, cIdx) => (
                    <td key={cIdx} className="border-t border-[#E2E8F0] p-0">
                      <input
                        value={row[cIdx] ?? ""}
                        readOnly={readOnly}
                        onChange={(e) => patchCell(rIdx, cIdx, e.target.value)}
                        className="w-full bg-transparent px-4 py-2.5 text-[13px] text-[#2D3436] outline-none"
                        placeholder="Cell"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!readOnly && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <button type="button" className="rounded-md border px-2 py-1 hover:bg-muted" onClick={addRow}>+ Row</button>
            <button type="button" className="rounded-md border px-2 py-1 hover:bg-muted" onClick={removeRow}>- Row</button>
            <button type="button" className="rounded-md border px-2 py-1 hover:bg-muted" onClick={addColumn}>+ Column</button>
            <button type="button" className="rounded-md border px-2 py-1 hover:bg-muted" onClick={removeColumn}>- Column</button>
          </div>
        )}
      </div>
    );
  }

  if (element.type === "stat_box") {
    const stats = element.stats.length ? element.stats : [{ value: "", label: "" }];
    const patchStat = (idx: number, key: "value" | "label", value: string) => {
      const next = stats.map((s) => ({ ...s }));
      next[idx]![key] = value;
      onChange({ ...element, stats: next });
    };
    return (
      <div className="group relative min-w-0 max-w-full pr-8">
        {removeBtn}
        <div className="flex flex-wrap gap-3">
          {stats.map((s, i) => (
            <div key={i} className="min-w-[120px] flex-1 rounded-[10px] border border-[#E8E5FC] bg-[#F8F7FF] p-4 text-center">
              <input
                value={s.value}
                readOnly={readOnly}
                onChange={(e) => patchStat(i, "value", e.target.value)}
                className="w-full bg-transparent text-center text-2xl font-bold text-[#6C5CE7] outline-none"
                placeholder="0"
              />
              <input
                value={s.label}
                readOnly={readOnly}
                onChange={(e) => patchStat(i, "label", e.target.value)}
                className="mt-1 w-full bg-transparent text-center text-xs text-[#636E72] outline-none"
                placeholder="Label"
              />
            </div>
          ))}
        </div>
        {!readOnly && (
          <div className="mt-2 flex gap-2 text-xs">
            <button
              type="button"
              className="rounded-md border px-2 py-1 hover:bg-muted"
              onClick={() => onChange({ ...element, stats: [...stats, { value: "", label: "" }] })}
            >
              + Stat
            </button>
            <button
              type="button"
              className="rounded-md border px-2 py-1 hover:bg-muted"
              onClick={() => stats.length > 1 && onChange({ ...element, stats: stats.slice(0, -1) })}
            >
              - Stat
            </button>
          </div>
        )}
      </div>
    );
  }

  if (element.type === "timeline") {
    const items = element.items.length ? element.items : [{ title: "", description: "" }];
    const patchItem = (idx: number, key: "title" | "description", value: string) => {
      const next = items.map((it) => ({ ...it }));
      next[idx]![key] = value;
      onChange({ ...element, items: next });
    };
    return (
      <div className="group relative min-w-0 max-w-full pr-8">
        {removeBtn}
        <div className="relative pl-8">
          <div className="absolute bottom-1 left-2 top-1 w-[2px] bg-[#E8E5FC]" />
          {items.map((item, i) => (
            <div key={i} className="relative mb-4">
              <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#6C5CE7] shadow-[0_0_0_2px_#E8E5FC]" />
              <input
                value={item.title}
                readOnly={readOnly}
                onChange={(e) => patchItem(i, "title", e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-[#2D3436] outline-none"
                placeholder="Milestone title"
              />
              <Textarea
                value={item.description}
                readOnly={readOnly}
                onChange={(e) => patchItem(i, "description", e.target.value)}
                className="mt-1 min-h-[44px] w-full resize-none border-0 bg-transparent p-0 text-[13px] text-[#636E72] shadow-none outline-none focus-visible:ring-0"
                placeholder="Description"
              />
            </div>
          ))}
        </div>
        {!readOnly && (
          <div className="mt-2 flex gap-2 text-xs">
            <button
              type="button"
              className="rounded-md border px-2 py-1 hover:bg-muted"
              onClick={() => onChange({ ...element, items: [...items, { title: "New milestone", description: "" }] })}
            >
              + Item
            </button>
            <button
              type="button"
              className="rounded-md border px-2 py-1 hover:bg-muted"
              onClick={() => items.length > 1 && onChange({ ...element, items: items.slice(0, -1) })}
            >
              - Item
            </button>
          </div>
        )}
      </div>
    );
  }

  if (element.type === "two_column") {
    return (
      <div className="group relative min-w-0 max-w-full pr-8">
        {removeBtn}
        <div className="flex gap-4">
          <div className="flex-1 rounded-lg bg-[#F9F9F9] p-4">
            <Textarea
              value={element.left}
              readOnly={readOnly}
              onChange={(e) => onChange({ ...element, left: e.target.value })}
              className="min-h-[80px] w-full resize-none border-0 bg-transparent p-0 text-[13px] leading-6 text-[#2D3436] shadow-none outline-none focus-visible:ring-0"
              placeholder="Left column content"
            />
          </div>
          <div className="flex-1 rounded-lg bg-[#F9F9F9] p-4">
            <Textarea
              value={element.right}
              readOnly={readOnly}
              onChange={(e) => onChange({ ...element, right: e.target.value })}
              className="min-h-[80px] w-full resize-none border-0 bg-transparent p-0 text-[13px] leading-6 text-[#2D3436] shadow-none outline-none focus-visible:ring-0"
              placeholder="Right column content"
            />
          </div>
        </div>
      </div>
    );
  }

  if (element.type === "image") {
    return (
      <div className="group relative min-w-0 max-w-full space-y-2 pr-8">
        {removeBtn}
        <Input
          value={element.url}
          onChange={(e) => onChange({ ...element, url: e.target.value })}
          readOnly={readOnly}
          placeholder="Image URL"
          className="w-full max-w-full min-w-0 rounded-lg border-border text-sm break-all"
        />
        <Input
          value={element.alt}
          onChange={(e) => onChange({ ...element, alt: e.target.value })}
          readOnly={readOnly}
          placeholder="Alt text"
          className="w-full max-w-full min-w-0 rounded-lg border-border text-sm break-words"
        />
      </div>
    );
  }

  if (element.type === "callout") {
    return (
      <div className="group relative min-w-0 max-w-full pr-8">
        {removeBtn}
        <div className="min-w-0 max-w-full rounded-lg border-l-4 border-[#6C5CE7] bg-[#E8E5FC] py-2 pl-3 pr-2 dark:border-violet-400 dark:bg-violet-950/40">
          <Textarea
            value={element.content}
            onChange={(e) => onChange({ ...element, content: e.target.value })}
            readOnly={readOnly}
            className="min-h-[56px] w-full min-w-0 max-w-full resize-none border-0 bg-transparent p-0 text-sm font-semibold text-[#4C3FB5] shadow-none outline-none focus-visible:ring-0 break-words dark:text-violet-100"
            placeholder="Key point…"
          />
        </div>
      </div>
    );
  }

  if (element.type === "quote") {
    return (
      <div className="group relative min-w-0 max-w-full pr-8">
        {removeBtn}
        <Textarea
          value={element.content}
          onChange={(e) => onChange({ ...element, content: e.target.value })}
          readOnly={readOnly}
          className="min-h-[56px] w-full min-w-0 max-w-full resize-none border-l-4 border-[#6C5CE7] bg-transparent py-1 pl-3 text-sm italic text-muted-foreground shadow-none outline-none focus-visible:ring-0 break-words"
          placeholder="Quote…"
        />
      </div>
    );
  }

  if (element.type === "heading") {
    return (
      <div className="group relative min-w-0 max-w-full pr-8">
        {removeBtn}
        <Textarea
          value={element.content}
          onChange={(e) => onChange({ ...element, content: e.target.value })}
          readOnly={readOnly}
          className="min-h-[46px] w-full min-w-0 max-w-full resize-none border-0 bg-transparent p-0 text-lg font-bold leading-snug text-foreground shadow-none outline-none focus-visible:ring-0 break-words md:text-2xl"
          placeholder="Heading…"
        />
      </div>
    );
  }

  return (
    <div className="group relative min-w-0 max-w-full pr-8">
      {removeBtn}
      <Textarea
        value={element.content}
        onChange={(e) => onChange({ ...element, content: e.target.value })}
        readOnly={readOnly}
        className="min-h-[56px] w-full min-w-0 max-w-full resize-none border-0 bg-transparent p-0 text-sm shadow-none outline-none focus-visible:ring-0 break-words"
        placeholder="Text…"
      />
    </div>
  );
}

function SlideCanvas({
  slide,
  slideIndex,
  slideCount,
  readOnly,
  onUpdate,
}: {
  slide: PresentationSlide;
  slideIndex: number;
  slideCount: number;
  readOnly?: boolean;
  onUpdate: (s: PresentationSlide) => void;
}) {
  const elements = slide.elements ?? [];

  function patchElement(i: number, next: SlideElement) {
    const nextEls = [...elements];
    nextEls[i] = next;
    onUpdate({ ...slide, elements: nextEls });
  }

  function removeElement(i: number) {
    onUpdate({ ...slide, elements: elements.filter((_, idx) => idx !== i) });
  }

  function addElement(kind: SlideElement["type"]) {
    onUpdate({ ...slide, elements: [...elements, freshElement(kind)] });
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <p className="mb-2 break-words text-sm text-muted-foreground">
        Slide {slideIndex + 1} / {slideCount}
      </p>
      <div className="aspect-[16/9] w-full max-w-full min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-sm md:p-6">
        <Input
          value={slide.title}
          onChange={(e) => onUpdate({ ...slide, title: e.target.value })}
          readOnly={readOnly}
          className="mb-3 w-full min-w-0 max-w-full border-0 bg-transparent p-0 text-lg font-bold shadow-none focus-visible:ring-0 break-words md:mb-4 md:text-2xl"
          placeholder="Slide title…"
        />
        <div className="min-w-0 space-y-3 break-words md:space-y-4">
          {elements.map((el, i) => (
            <SlideElementEditor
              key={`${slideIndex}-${i}-${el.type}`}
              element={el}
              readOnly={readOnly}
              onChange={(next) => patchElement(i, next)}
              onDelete={() => removeElement(i)}
            />
          ))}
        </div>
        {!readOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className="mt-3 inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:mt-4"
            >
              <Plus className="size-4 stroke-[1.5]" />
              Add element
              <ChevronDown className="size-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 rounded-xl border-border" align="start">
              <DropdownMenuItem onClick={() => addElement("text")}>Text</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addElement("heading")}>Heading</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addElement("bullet_list")}>Bullet list</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addElement("numbered_list")}>Numbered list</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addElement("image")}>Image</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addElement("callout")}>Callout</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addElement("quote")}>Quote</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addElement("divider")}>Divider</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addElement("table")}>Table</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addElement("stat_box")}>Stats</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addElement("timeline")}>Timeline</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addElement("two_column")}>Two columns</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="mt-3 min-w-0 max-w-full rounded-lg border border-border bg-muted/10 p-3 md:mt-4 md:p-4">
        <p className="mb-1 text-xs text-muted-foreground">Speaker notes</p>
        <Textarea
          value={slide.notes ?? ""}
          onChange={(e) => onUpdate({ ...slide, notes: e.target.value })}
          readOnly={readOnly}
          className="min-h-[72px] w-full min-w-0 max-w-full resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 break-words"
          placeholder="Add speaker notes…"
        />
      </div>
    </div>
  );
}

export function PresentationEditor({
  slides,
  onSlidesChange,
  readOnly,
}: {
  slides: PresentationSlide[];
  onSlidesChange: (next: PresentationSlide[]) => void;
  readOnly?: boolean;
}) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (slides.length === 0) return;
    setActiveSlide((i) => Math.min(i, slides.length - 1));
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No slides yet. {readOnly ? "" : "Use Regenerate with a stored prompt, or add a slide."}
      </p>
    );
  }

  const safeIndex = Math.min(activeSlide, slides.length - 1);
  const current = slides[safeIndex]!;

  function addSlide() {
    onSlidesChange([
      ...slides,
      {
        title: "New slide",
        elements: [{ type: "text", content: "" }],
        notes: "",
      },
    ]);
    setActiveSlide(slides.length);
  }

  function patchCurrent(updated: PresentationSlide) {
    const next = [...slides];
    next[safeIndex] = updated;
    onSlidesChange(next);
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-background">
      <div className="min-w-0 max-w-full px-4 py-4 md:px-8 md:py-6">
        <SlideCanvas
          slide={current}
          slideIndex={safeIndex}
          slideCount={slides.length}
          readOnly={readOnly}
          onUpdate={patchCurrent}
        />
      </div>

      <div className="min-w-0 max-w-full border-t border-border px-4 py-3 md:px-8">
        <div className="scrollbar-hide flex min-w-0 gap-2 overflow-x-auto pb-1">
          {slides.map((slide, i) => {
            const preview = slide.elements?.[0] ? slideElementToPlainText(slide.elements[0]).slice(0, 48) : "…";
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActiveSlide(i)}
                className={cn(
                  "flex aspect-[16/9] w-24 shrink-0 flex-col rounded-lg border-2 p-1.5 text-left transition-all md:w-32 md:p-2",
                  "hover:border-yeo-400/60",
                  i === safeIndex ? "border-yeo-600 bg-card shadow-sm" : "border-border bg-muted/30"
                )}
              >
                <p className="line-clamp-2 text-[8px] font-semibold leading-tight md:text-[10px]">
                  {slide.title || "Untitled"}
                </p>
                <p className="mt-0.5 line-clamp-2 flex-1 text-[6px] text-muted-foreground md:text-[8px]">{preview}</p>
                <span className="mt-auto text-right text-[7px] tabular-nums text-muted-foreground/80">{i + 1}</span>
              </button>
            );
          })}
          {!readOnly && (
            <button
              type="button"
              onClick={addSlide}
              className="flex aspect-[16/9] w-24 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-yeo-500 hover:text-yeo-700 md:w-32"
              aria-label="Add slide"
            >
              <Plus className="size-5 stroke-[1.5] md:size-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
