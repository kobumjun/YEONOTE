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
  return (
    <div className="group relative rounded-lg border border-border/60 bg-muted/20 p-3">
      {!readOnly && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 size-8 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          aria-label="Remove element"
          onClick={onDelete}
        >
          <Trash2 className="size-4 stroke-[1.5]" />
        </Button>
      )}
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {element.type.replace(/_/g, " ")}
      </p>
      {element.type === "bullet_list" || element.type === "numbered_list" ? (
        <Textarea
          value={element.items.join("\n")}
          onChange={(e) =>
            onChange({
              ...element,
              items: e.target.value.split("\n").map((s) => s.trimEnd()),
            })
          }
          readOnly={readOnly}
          className="min-h-[88px] rounded-lg border-border text-sm"
          placeholder="One line per item"
        />
      ) : element.type === "divider" ? (
        <hr className="border-border" />
      ) : element.type === "image" ? (
        <div className="space-y-2">
          <Input
            value={element.url}
            onChange={(e) => onChange({ ...element, url: e.target.value })}
            readOnly={readOnly}
            placeholder="Image URL"
            className="rounded-lg border-border"
          />
          <Input
            value={element.alt}
            onChange={(e) => onChange({ ...element, alt: e.target.value })}
            readOnly={readOnly}
            placeholder="Alt text"
            className="rounded-lg border-border"
          />
        </div>
      ) : (
        <Textarea
          value={element.content}
          onChange={(e) => {
            if (
              element.type === "text" ||
              element.type === "heading" ||
              element.type === "callout" ||
              element.type === "quote"
            ) {
              onChange({ ...element, content: e.target.value });
            }
          }}
          readOnly={readOnly}
          className="min-h-[72px] rounded-lg border-border text-sm"
        />
      )}
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
      <div className="mb-6 aspect-[16/9] rounded-xl border border-border bg-card p-6 shadow-sm">
        <Input
          value={slide.title}
          onChange={(e) => onUpdate({ ...slide, title: e.target.value })}
          readOnly={readOnly}
          className="mb-4 border-0 bg-transparent p-0 text-2xl font-bold shadow-none focus-visible:ring-0"
          placeholder="Slide title..."
        />
        <div className="max-h-[min(320px,42vh)] space-y-3 overflow-y-auto pr-1">
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
          placeholder="Add speaker notes..."
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
              "relative flex w-full flex-col gap-0.5 rounded-lg border-2 bg-card p-2 text-left transition-all aspect-[16/9]",
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
            className="flex aspect-[16/9] w-full items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-yeo-500 hover:text-yeo-700"
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
