"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TabId = "document" | "presentation" | "image" | "template";

const TABS: { id: TabId; label: string }[] = [
  { id: "document", label: "Document" },
  { id: "presentation", label: "Presentation" },
  { id: "image", label: "Image" },
  { id: "template", label: "Template" },
];

const TAB_CONTENT: Record<
  TabId,
  { input: string; previewTitle: string; previewLines: string[]; previewHint?: string }
> = {
  document: {
    input: "Write a cover letter for a marketing role at a tech startup",
    previewTitle: "Professional cover letter",
    previewLines: [
      "Proper formatting, greeting, body, and closing tailored to the role and company tone.",
    ],
  },
  presentation: {
    input: "Create a 7-slide pitch deck for a fitness app",
    previewTitle: "7-slide pitch deck",
    previewLines: [
      "Title",
      "Problem",
      "Solution",
      "Market",
      "Product",
      "Traction",
      "Ask",
    ],
    previewHint: "Slides update live in the editor — export to .pptx when you are ready.",
  },
  image: {
    input: "Design a minimalist poster for a jazz concert",
    previewTitle: "Minimalist concert poster",
    previewLines: ["Bold typography, negative space, and a single focal illustration — ready to download as PNG."],
  },
  template: {
    input: "Weekly workout tracker with meal logging",
    previewTitle: "Structured workspace",
    previewLines: ["Checklists, tables, and sections you can rearrange — built for daily logging and review."],
  },
};

const ROTATE_MS = 3000;

export function Demo() {
  const [tab, setTab] = useState<TabId>("document");
  const tabRef = useRef(tab);
  tabRef.current = tab;

  const setTabAndReset = useCallback((id: TabId) => {
    setTab(id);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const i = TABS.findIndex((x) => x.id === tabRef.current);
      const next = TABS[(i + 1) % TABS.length]!.id;
      setTab(next);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, []);

  const c = TAB_CONTENT[tab];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h2 className="text-center font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
        See what YEO can create
      </h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Switch between formats — or let the preview cycle automatically.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTabAndReset(id)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200",
              tab === id
                ? "border-yeo-600 bg-yeo-600 text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-yeo-400/50 hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="border-b border-border bg-muted/30 p-6 md:border-b-0 md:border-r md:border-border">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Input</p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{c.input}</p>
          </div>
          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</p>
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-foreground">
                {tab === "document" && "📄 "}
                {tab === "presentation" && "📊 "}
                {tab === "image" && "🖼️ "}
                {tab === "template" && "📋 "}
                {c.previewTitle}
              </p>
              {tab === "presentation" ? (
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {c.previewLines.map((line, i) => (
                    <div
                      key={line}
                      className="flex w-[52px] shrink-0 flex-col items-center justify-center rounded border border-border bg-muted/40 px-1 py-2 text-center shadow-sm"
                      style={{ aspectRatio: "16 / 9" }}
                    >
                      <span className="text-[8px] font-semibold text-foreground/80">{i + 1}</span>
                      <span className="mt-0.5 line-clamp-2 text-[8px] leading-tight text-muted-foreground">{line}</span>
                    </div>
                  ))}
                </div>
              ) : tab === "image" ? (
                <div className="flex aspect-video max-h-40 items-center justify-center rounded-lg border border-dashed border-yeo-400/40 bg-gradient-to-br from-yeo-100/80 via-card to-violet-100/60 dark:from-yeo-950/40 dark:to-violet-950/30">
                  <span className="text-center text-xs font-medium text-muted-foreground">Poster preview</span>
                </div>
              ) : (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {c.previewLines.map((line) => (
                    <li key={line} className="leading-relaxed">
                      {line}
                    </li>
                  ))}
                </ul>
              )}
              {c.previewHint ? <p className="text-xs text-yeo-700 dark:text-yeo-300">{c.previewHint}</p> : null}
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
