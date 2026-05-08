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

const THUMB_H = "h-[84px]";

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
      <div className="group relative pr-8">
        {removeBtn}
        <ul className="list-disc space-y-1.5 pl-5 marker:text-foreground">
          {items.map((item, idx) => (
            <li key={idx} className="pl-0.5">
              <input
                value={item}
                readOnly={readOnly}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = e.target.value;
                  onChange({ ...element, items: next });
                }}
                className="w-full border-0 bg-transparent p-0 text-sm outline-none focus-visible:ring-0"
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
      <div className="group relative pr-8">
        {removeBtn}
        <ol className="list-decimal space-y-1.5 pl-5 marker:font-medium marker:text-foreground">
          {items.map((item, idx) => (
            <li key={idx}>
              <input
                value={item}
                readOnly={readOnly}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = e.target.value;
                  onChange({ ...element, items: next });
                }}
                className="w-full border-0 bg-transparent p-0 text-sm outline-none focus-visible:ring-0"
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
      <div className="group relative pr-8">
        {removeBtn}
        <hr className="border-border" />
      </div>
    );
  }

  if (element.type === "image") {
    return (
      <div className="group relative space-y-2 pr-8">
        {removeBtn}
        <Input
          value={element.url}
          onChange={(e) => onChange({ ...element, url: e.target.value })}
          readOnly={readOnly}
          placeholder="Image URL"
          className="rounded-lg border-border text-sm"
        />
        <Input
          value={element.alt}
          onChange={(e) => onChange({ ...element, alt: e.target.value })}
          readOnly={readOnly}
          placeholder="Alt text"
          className="rounded-lg border-border text-sm"
        />
      </div>
    );
  }

  if (element.type === "callout") {
    return (
      <div className="group relative pr-8">
        {removeBtn}
        <div className="rounded-lg border-l-4 border-violet-500 bg-violet-50 py-2 pl-3 pr-2 dark:bg-violet-950/40">
          <Textarea
            value={element.content}
            onChange={(e) => onChange({ ...element, content: e.target.value })}
            readOnly={readOnly}
            className="min-h-[56px] resize-none border-0 bg-transparent p-0 text-sm text-violet-950 shadow-none outline-none focus-visible:ring-0 dark:text-violet-100"
            placeholder="Key point…"
          />
        </div>
      </div>
    );
  }

  if (element.type === "quote") {
    return (
      <div className="group relative pr-8">
        {removeBtn}
        <Textarea
          value={element.content}
          onChange={(e) => onChange({ ...element, content: e.target.value })}
          readOnly={readOnly}
          className="min-h-[56px] resize-none border-l-2 border-muted-foreground/40 bg-transparent py-1 pl-3 text-sm italic text-muted-foreground shadow-none outline-none focus-visible:ring-0"
          placeholder="Quote…"
        />
      </div>
    );
  }

  if (element.type === "heading") {
    return (
      <div className="group relative pr-8">
        {removeBtn}
        <Textarea
          value={element.content}
          onChange={(e) => onChange({ ...element, content: e.target.value })}
          readOnly={readOnly}
          className="min-h-[44px] resize-none border-0 bg-transparent p-0 text-xl font-semibold leading-snug shadow-none outline-none focus-visible:ring-0"
          placeholder="Heading…"
        />
      </div>
    );
  }

  /* text */
  return (
    <div className="group relative pr-8">
      {removeBtn}
      <Textarea
        value={element.content}
        onChange={(e) => onChange({ ...element, content: e.target.value })}
        readOnly={readOnly}
        className="min-h-[56px] resize-none border-0 bg-transparent p-0 text-sm shadow-none outline-none focus-visible:ring-0"
        placeholder="Text…"
      />
    </div>
  );
}

function SlideCanvas({
  slide,
  slideNumber,
  readOnly,
  onUpdate,
}: {
  slide: PresentationSlide;
  slideNumber: number;
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
    <div className="mx-auto max-w-3xl">
      <span className="mb-2 block text-sm text-muted-foreground">Slide {slideNumber}</span>
      <div
        className="relative mb-6 w-full max-w-[800px] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-sm"
        style={{ aspectRatio: "16 / 9", minHeight: 400, maxHeight: 500 }}
      >
        <Input
          value={slide.title}
          onChange={(e) => onUpdate({ ...slide, title: e.target.value })}
          readOnly={readOnly}
          className="mb-4 border-0 bg-transparent p-0 text-2xl font-bold shadow-none focus-visible:ring-0"
          placeholder="Slide title…"
        />
        <div className="space-y-4">
          {elements.map((el, i) => (
            <SlideElementEditor
              key={`${slideNumber}-${i}-${el.type}`}
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
              className="mt-4 inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="rounded-lg border border-border bg-muted/10 p-4">
        <p className="mb-1 text-xs text-muted-foreground">Speaker notes</p>
        <Textarea
          value={slide.notes ?? ""}
          onChange={(e) => onUpdate({ ...slide, notes: e.target.value })}
          readOnly={readOnly}
          className="min-h-[72px] resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
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

  return (
    <div className="flex min-h-[calc(100vh-220px)] gap-0 rounded-xl border border-border bg-background">
      <div className="w-48 shrink-0 space-y-2 overflow-y-auto border-r border-border bg-muted/30 p-3">
        {slides.map((slide, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveSlide(i)}
            className={cn(
              "relative flex w-full shrink-0 flex-col justify-between rounded-lg border-2 bg-card p-2 text-left transition-all",
              THUMB_H,
              "hover:border-yeo-400/50",
              i === safeIndex ? "border-yeo-600 shadow-sm" : "border-border"
            )}
          >
            <span className="absolute bottom-1 right-1.5 text-[9px] text-muted-foreground">{i + 1}</span>
            <p className="line-clamp-2 pr-4 text-[9px] font-semibold leading-tight">{slide.title || "Untitled"}</p>
            <p className="line-clamp-2 text-[8px] text-muted-foreground">
              {slide.elements?.[0] ? slideElementToPlainText(slide.elements[0]).slice(0, 80) : "…"}
            </p>
          </button>
        ))}
        {!readOnly && (
          <button
            type="button"
            onClick={addSlide}
            className={cn(
              "flex w-full shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-yeo-500 hover:text-yeo-700",
              THUMB_H
            )}
          >
            <Plus className="size-5 stroke-[1.5]" />
          </button>
        )}
      </div>
      <div className="min-w-0 flex-1 overflow-y-auto p-6 md:p-8">
        <SlideCanvas
          slide={current}
          slideNumber={safeIndex + 1}
          readOnly={readOnly}
          onUpdate={(updated) => {
            const next = [...slides];
            next[safeIndex] = updated;
            onSlidesChange(next);
          }}
        />
      </div>
    </div>
  );
}
