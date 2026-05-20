"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  normalizePresentationSlides,
  slideElementToPlainText,
  type PresentationContent,
} from "@/types/template";

export function PresentationMode({
  deckId,
  title,
  content,
}: {
  deckId: string;
  title: string;
  content: unknown;
}) {
  const c = (content ?? { slides: [] }) as PresentationContent;
  const slides = normalizePresentationSlides(c.slides ?? []);
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  if (!slide) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">No slides in this deck.</p>
        <Link
          href={`/deck/${deckId}`}
          className="ml-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to editor
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href={`/deck/${deckId}`}
          className="inline-flex size-8 items-center justify-center rounded-lg text-white hover:bg-white/10"
        >
          <X className="size-5" />
        </Link>
        <span className="text-sm text-white/70">
          {index + 1} / {slides.length}
        </span>
        <span className="w-10" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-8 md:px-16">
        <h1 className="mb-8 max-w-4xl text-center text-3xl font-bold md:text-5xl">{slide.title}</h1>
        <div className="max-w-3xl space-y-4 text-lg md:text-xl">
          {slide.elements.map((el, i) => (
            <p key={i} className="text-white/90">
              {slideElementToPlainText(el)}
            </p>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between px-6 py-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
        >
          <ChevronLeft className="size-6" />
        </Button>
        <p className="text-sm text-white/60">{title}</p>
        <Button
          variant="ghost"
          size="icon"
          className="text-white"
          disabled={index >= slides.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          <ChevronRight className="size-6" />
        </Button>
      </div>
    </div>
  );
}
