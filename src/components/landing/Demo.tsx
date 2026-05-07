"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

const steps = ["Analyzing request...", "Designing block structure...", "Building database views...", "Finalizing layout..."];

export function Demo() {
  const [i, setI] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const sample =
    "I need a weekly project workspace with task tracking, meeting notes, and sprint planning in one page.";

  useEffect(() => {
    const t = setInterval(() => {
      setI((x) => (x + 1) % steps.length);
    }, 1400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let j = 0;
    const id = setInterval(() => {
      j += 1;
      setLines(sample.slice(0, j).split("\n").slice(-3));
      if (j >= sample.length) {
        clearInterval(id);
      }
    }, 35);
    return () => clearInterval(id);
  }, [sample]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h2 className="text-center font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
        Live Preview
      </h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        See how a short brief transforms into structured blocks.
      </p>
      <Card className="mt-10 overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="border-b border-border bg-muted/30 p-6 md:border-b-0 md:border-r md:border-border">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Input</p>
            <p className="mt-3 min-h-[4.5rem] whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {lines.join("")}
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-yeo-500 align-middle" />
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-yeo-500 transition-all duration-500"
                style={{ width: `${((i + 1) / steps.length) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-yeo-600 dark:text-yeo-400">{steps[i]}</p>
          </div>
          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="rounded-lg border border-border bg-card p-3 shadow-sm">📋 Weekly Project Hub</div>
              <div className="rounded-lg border border-yeo-200/60 bg-yeo-50/50 p-3 dark:border-yeo-900 dark:bg-yeo-950/30">
                💡 Plan your sprint on Monday and keep notes right next to it.
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-muted-foreground shadow-sm">▸ This week (3)</div>
              <div className="h-2 rounded bg-muted" />
              <div className="rounded-lg border border-border bg-card p-2 text-xs text-muted-foreground shadow-sm">
                Table · Task tracking
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
