"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUiStore } from "@/stores/uiStore";
import { useAIGenerate } from "@/hooks/useAIGenerate";
import { normalizeAiTemplate, normalizeDocumentBlocksFromAi } from "@/types/template";
import { GENERATE_MODAL_PREFILL_KEY, LANDING_PROMPT_STORAGE_KEY } from "@/lib/landing-prompt-bridge";
import { CREDITS_PER_GENERATION } from "@/lib/ai-credits";
import { cn } from "@/lib/utils";
import { withAuth } from "@/lib/auth-fetch";
import type { TemplateRow } from "@/types/database";

const PLACEHOLDER_ROTATION = [
  "e.g., Write a business proposal for a coffee shop",
  "e.g., Create a 10-slide pitch deck for my startup",
  "e.g., Design a poster for a music festival",
  "e.g., Build a weekly project management dashboard",
];

const EXAMPLE_CHIPS = [
  "10-slide pitch deck for my startup",
  "YouTube thumbnail about productivity",
  "Professional resignation letter",
  "Weekly workout tracker",
];

function creationEmoji(type: string) {
  if (type === "presentation") return "📊";
  if (type === "document") return "📄";
  if (type === "image") return "🖼️";
  return "📋";
}

export function HomeDashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const promptFocusNonce = useUiStore((s) => s.promptFocusNonce);

  const [prompt, setPrompt] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [recent, setRecent] = useState<TemplateRow[]>([]);
  const [noCreditsOpen, setNoCreditsOpen] = useState(false);
  const { generateStream, streaming } = useAIGenerate();

  const redirectToCreationsIfListParams = useCallback(() => {
    const view = searchParams.get("view");
    const q = searchParams.get("q");
    const page = searchParams.get("page");
    const sort = searchParams.get("sort");
    const filter = searchParams.get("filter");
    if (view || q || page || sort || filter) {
      const sp = new URLSearchParams(searchParams.toString());
      router.replace(`/dashboard/creations?${sp.toString()}`);
      return true;
    }
    return false;
  }, [router, searchParams]);

  useEffect(() => {
    redirectToCreationsIfListParams();
  }, [redirectToCreationsIfListParams]);

  useEffect(() => {
    try {
      const fromLanding = sessionStorage.getItem(LANDING_PROMPT_STORAGE_KEY);
      if (fromLanding) {
        sessionStorage.removeItem(LANDING_PROMPT_STORAGE_KEY);
        setPrompt(fromLanding);
      }
      const pre = sessionStorage.getItem(GENERATE_MODAL_PREFILL_KEY);
      if (pre) {
        sessionStorage.removeItem(GENERATE_MODAL_PREFILL_KEY);
        setPrompt((p) => (p.trim() ? p : pre));
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_ROTATION.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (promptFocusNonce === 0) return;
    textareaRef.current?.focus();
  }, [promptFocusNonce]);

  useEffect(() => {
    if (searchParams.get("focus") === "1") {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
      router.replace("/dashboard", { scroll: false });
    }
  }, [searchParams, router]);

  const loadRecent = useCallback(async () => {
    const res = await fetch("/api/templates?view=all&sort=recent&page=1", await withAuth());
    const j = await res.json();
    if (res.ok) {
      const list = (j.templates ?? []) as TemplateRow[];
      setRecent(list.slice(0, 6));
    }
  }, []);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error("Describe what you want to create.");
      return;
    }
    try {
      const result = await generateStream(prompt, {});
      if (!result) return;
      const payload = result.payload;
      const saveBody: Record<string, unknown> = {
        title: payload.title,
        icon: payload.icon,
        cover: payload.cover,
        ai_prompt: prompt,
        creation_type: payload.creationType,
      };

      if (payload.creationType === "template") {
        const normalized = normalizeAiTemplate(payload);
        saveBody.content = { blocks: normalized.blocks };
      } else if (payload.creationType === "document") {
        saveBody.content = { blocks: normalizeDocumentBlocksFromAi(payload.blocks) };
      } else if (payload.creationType === "presentation") {
        saveBody.content = { title: payload.title, slides: payload.slides };
      } else {
        saveBody.content = { imageUrl: payload.imageUrl, prompt };
      }
      const res = await fetch(
        "/api/templates",
        await withAuth({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveBody),
        })
      );
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Failed to save creation");
        return;
      }
      toast.success("Creation saved.");
      if (result.warning) toast.message(result.warning);
      if (result.usedCredit && typeof result.creditsRemaining === "number") {
        toast.message(`Used ${result.chargedCredits} credit(s). ${result.creditsRemaining} credits left.`);
      }
      setPrompt("");
      void loadRecent();
      router.push(`/template/${j.template.id}`);
      router.refresh();
    } catch (e) {
      const code = e instanceof Error && "code" in e ? (e as Error & { code?: string }).code : undefined;
      if (code === "NO_CREDITS") {
        setNoCreditsOpen(true);
        return;
      }
      toast.error(e instanceof Error ? e.message : "Generation failed");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleGenerate();
    }
  }

  return (
    <div className="min-h-[calc(100dvh-7rem)] px-4 pb-12 pt-10 md:px-6 md:pt-16 md:pb-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center md:mb-12">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            What will you
            <br className="sm:hidden" />{" "}
            <span className="yeo-gradient-text">create</span>?
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground md:text-base">
            Documents, presentations, images, and templates — powered by AI
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={streaming}
              placeholder={PLACEHOLDER_ROTATION[placeholderIndex]}
              rows={5}
              className={cn(
                "min-h-32 w-full resize-none rounded-2xl border border-border/80 bg-card/90 p-5 pb-20 pr-5 text-base shadow-sm outline-none ring-offset-background transition-all placeholder:text-muted-foreground/70 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20 md:min-h-36 md:p-6 md:pb-24 md:pr-6",
                streaming && "opacity-60"
              )}
            />
            <Button
              type="button"
              disabled={!prompt.trim() || streaming}
              className="absolute bottom-3 right-3 z-10 yeo-gradient-btn h-10 gap-2 rounded-xl px-5 text-sm font-semibold shadow-md md:bottom-4 md:right-4"
              onClick={() => void handleGenerate()}
            >
              {streaming ? (
                <>
                  <Loader2 className="size-4 animate-spin stroke-[1.75]" />
                  Creating…
                </>
              ) : (
                <>
                  Generate
                  <span className="text-[11px] font-medium opacity-90">({CREDITS_PER_GENERATION})</span>
                  <ArrowRight className="size-4 stroke-[1.75]" />
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {EXAMPLE_CHIPS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setPrompt(ex)}
                className="rounded-full border border-transparent bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {recent.length > 0 ? (
          <div className="mt-14 md:mt-20">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent</h2>
              <Link
                href="/dashboard/creations"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {recent.slice(0, 4).map((c) => (
                <Link
                  key={c.id}
                  href={`/template/${c.id}`}
                  className="group rounded-2xl border border-border/70 bg-card/80 p-4 text-left shadow-sm backdrop-blur-sm transition-all hover:border-violet-300/40 hover:shadow-md dark:hover:border-violet-500/20"
                >
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-muted/60 text-lg transition-colors group-hover:bg-violet-500/10">
                    <span aria-hidden>{creationEmoji(c.creation_type)}</span>
                  </div>
                  <p className="truncate text-sm font-semibold tracking-tight text-foreground">{c.title || "Untitled"}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">{c.creation_type ?? "template"}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={noCreditsOpen} onOpenChange={setNoCreditsOpen}>
        <DialogContent className="max-w-md rounded-2xl border-border/80 bg-card/95 shadow-lg backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-heading tracking-tight">You&apos;ve used all your free credits!</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Loved what you created? Unlock unlimited creations starting at just $5.</p>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button type="button" className="yeo-gradient-btn w-full rounded-2xl py-2.5 font-semibold" onClick={() => router.push("/pricing")}>
              See Plans
            </Button>
            <Button type="button" variant="ghost" className="w-full rounded-2xl" onClick={() => setNoCreditsOpen(false)}>
              Maybe later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
