"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Settings } from "lucide-react";
import { toast } from "sonner";
import { PresentationEditor } from "@/components/creation/PresentationEditor";
import { AIAgentPanel } from "@/components/deck/AIAgentPanel";
import { DeckExportMenu } from "@/components/deck/DeckExportMenu";
import {
  normalizePresentationSlides,
  type PresentationContent,
  type PresentationSlide,
} from "@/types/template";
import { withAuth } from "@/lib/auth-fetch";
import { normalizePlan, SLIDE_LIMITS, type UserPlan } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DeckEditor({
  deckId,
  initialTitle,
  initialContent,
  aiPrompt,
  isDeleted,
  plan: planRaw,
}: {
  deckId: string;
  initialTitle: string;
  initialContent: unknown;
  aiPrompt: string | null;
  isDeleted?: boolean;
  plan: string;
}) {
  const router = useRouter();
  const plan = normalizePlan(planRaw);
  const content = (initialContent ?? { slides: [] }) as PresentationContent;
  const [title, setTitle] = useState(initialTitle);
  const [slides, setSlides] = useState<PresentationSlide[]>(() =>
    normalizePresentationSlides(content.slides ?? [])
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [agentCollapsed, setAgentCollapsed] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const saveDeck = useCallback(async () => {
    const res = await fetch(
      `/api/templates/${deckId}`,
      await withAuth({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: { title, slides } }),
      })
    );
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error((j as { error?: string }).error ?? "Failed to save");
    }
  }, [deckId, title, slides]);

  useEffect(() => {
    if (isDeleted) return;
    const t = setTimeout(() => {
      saveDeck().catch((e) => toast.error(e instanceof Error ? e.message : "Autosave failed"));
    }, 600);
    return () => clearTimeout(t);
  }, [isDeleted, saveDeck]);

  const slideLimit = SLIDE_LIMITS[plan];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-white md:h-[calc(100vh-0px)]">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <input
          className="min-w-0 flex-1 border-none bg-transparent text-lg font-semibold outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={Boolean(isDeleted)}
        />
        <DeckExportMenu plan={plan} title={title} slides={slides} />
        <Link
          href={`/deck/${deckId}/present`}
          className="inline-flex h-7 items-center gap-1 rounded-xl border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
        >
          <Play className="size-4" />
          Present
        </Link>
        <Link
          href="/settings"
          className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted"
        >
          <Settings className="size-4" />
        </Link>
      </div>

      <div className="flex min-h-0 flex-1">
        {sidebarOpen && (
          <div className="hidden w-48 shrink-0 flex-col border-r border-border bg-[#F9FAFB] md:flex">
            <div className="border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
              Slides
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {slides.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveSlide(i)}
                  className={cn(
                    "mb-1 w-full rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                    i === activeSlide
                      ? "bg-[#6C5CE7]/15 font-medium text-[#6C5CE7]"
                      : "hover:bg-muted"
                  )}
                >
                  {i + 1}. {s.title || "Untitled"}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-4">
            <PresentationEditor
              slides={slides}
              onSlidesChange={(next) => {
                if (next.length > slideLimit) {
                  toast.error(`Your plan allows up to ${slideLimit} slides.`);
                  return;
                }
                setSlides(next);
              }}
              readOnly={Boolean(isDeleted)}
            />
          </div>
        </div>

        <AIAgentPanel
          deckId={deckId}
          plan={plan}
          currentSlideIndex={activeSlide}
          onSlidesUpdate={setSlides}
          onTitleUpdate={setTitle}
          collapsed={agentCollapsed}
          onCollapsedChange={setAgentCollapsed}
        />
      </div>

      {aiPrompt && (
        <p className="sr-only">Original prompt: {aiPrompt}</p>
      )}
    </div>
  );
}
