"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Loader2, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { withAuth } from "@/lib/auth-fetch";
import type { TemplateRow } from "@/types/database";
import { DECK_LIMITS, planLabel, type UserPlan } from "@/lib/subscription";
import { cn } from "@/lib/utils";

function slideCount(deck: TemplateRow): number {
  const c = deck.content as { slides?: unknown[] };
  return Array.isArray(c?.slides) ? c.slides.length : 0;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DashboardClient({ plan }: { plan: UserPlan }) {
  const router = useRouter();
  const [decks, setDecks] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [creating, setCreating] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const loadDecks = useCallback(async () => {
    const res = await fetch("/api/templates?sort=recent&page=1", await withAuth());
    const j = await res.json();
    if (res.ok) setDecks((j.templates ?? []) as TemplateRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDecks();
  }, [loadDecks]);

  useEffect(() => {
    const handler = () => setNewOpen(true);
    window.addEventListener("yeo:new-deck", handler);
    return () => window.removeEventListener("yeo:new-deck", handler);
  }, []);

  async function createBlank() {
    setCreating(true);
    try {
      const res = await fetch(
        "/api/templates",
        await withAuth({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blank: true, title: "Untitled deck" }),
        })
      );
      const j = await res.json();
      if (!res.ok) {
        if (j.code === "upgrade_required") {
          setUpgradeOpen(true);
          return;
        }
        throw new Error(j.error ?? "Failed to create deck");
      }
      router.push(`/deck/${j.template.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create deck");
    } finally {
      setCreating(false);
      setNewOpen(false);
    }
  }

  async function createWithAI() {
    if (!aiPrompt.trim()) {
      toast.error("Enter a prompt to generate a deck.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(
        "/api/ai/agent",
        await withAuth({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generate_deck", prompt: aiPrompt.trim() }),
        })
      );
      const gen = await res.json();
      if (!res.ok) {
        if (gen.code === "upgrade_required" || gen.code === "daily_limit") {
          setUpgradeOpen(true);
          return;
        }
        throw new Error(gen.error ?? "Generation failed");
      }

      const createRes = await fetch(
        "/api/templates",
        await withAuth({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: gen.updatedTitle ?? "AI Deck",
            content: { title: gen.updatedTitle, slides: gen.updatedSlides },
            ai_prompt: aiPrompt.trim(),
          }),
        })
      );
      const cj = await createRes.json();
      if (!createRes.ok) throw new Error(cj.error ?? "Failed to save deck");
      router.push(`/deck/${cj.template.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate deck");
    } finally {
      setCreating(false);
      setNewOpen(false);
    }
  }

  async function duplicateDeck(id: string) {
    const res = await fetch(`/api/templates/${id}/duplicate`, await withAuth({ method: "POST" }));
    const j = await res.json();
    if (!res.ok) {
      if (j.code === "upgrade_required") setUpgradeOpen(true);
      else toast.error(j.error ?? "Duplicate failed");
      return;
    }
    toast.success("Deck duplicated.");
    void loadDecks();
  }

  async function deleteDeck(id: string) {
    const res = await fetch(`/api/templates/${id}`, await withAuth({ method: "DELETE" }));
    if (!res.ok) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Deck deleted.");
    void loadDecks();
  }

  const atDeckLimit = plan === "free" && decks.length >= DECK_LIMITS.free;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      {atDeckLimit && (
        <div className="mb-6 rounded-xl border border-[#6C5CE7]/30 bg-[#F8F7FF] px-4 py-3 text-sm">
          Upgrade to Plus for unlimited decks.{" "}
          <Link href="/pricing" className="font-medium text-[#6C5CE7] hover:underline">
            See plans
          </Link>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recent Decks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {planLabel(plan)} plan · {plan === "free" ? "Up to 2 decks, 10 slides each" : plan === "plus" ? "Unlimited decks, 50 slides" : "Unlimited"}
          </p>
        </div>
        <Button
          className="rounded-xl bg-[#6C5CE7] hover:bg-[#5A4BD1]"
          onClick={() => setNewOpen(true)}
        >
          <Plus className="mr-1 size-4" />
          New Deck
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-[#6C5CE7]" />
        </div>
      ) : decks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">No decks yet. Create your first presentation.</p>
          <Button className="mt-4 bg-[#6C5CE7] hover:bg-[#5A4BD1]" onClick={() => setNewOpen(true)}>
            New Deck
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="group relative rounded-2xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <Link href={`/deck/${deck.id}`} className="block">
                <div className="mb-3 flex aspect-video items-center justify-center rounded-xl bg-[#F8F7FF] text-3xl">
                  📊
                </div>
                <h3 className="font-semibold line-clamp-1">{deck.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {slideCount(deck)} slides · {formatDate(deck.updated_at)}
                </p>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-lg opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                  )}
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/deck/${deck.id}`)}>
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void duplicateDeck(deck.id)}>
                    <Copy className="mr-2 size-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => void deleteDeck(deck.id)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>New deck</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="h-auto w-full flex-col items-start rounded-xl py-4 text-left"
              disabled={creating}
              onClick={() => void createBlank()}
            >
              <span className="font-semibold">Blank deck</span>
              <span className="text-xs text-muted-foreground">Start from an empty presentation</span>
            </Button>
            <div className="rounded-xl border border-border p-4">
              <p className="font-semibold">Generate with AI</p>
              <p className="mb-3 text-xs text-muted-foreground">
                e.g. Create a 10-slide investor pitch for a food delivery startup
              </p>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="resize-none rounded-xl"
                placeholder="Describe your presentation…"
              />
              <Button
                className="mt-3 w-full rounded-xl bg-[#6C5CE7] hover:bg-[#5A4BD1]"
                disabled={creating || !aiPrompt.trim()}
                onClick={() => void createWithAI()}
              >
                {creating ? <Loader2 className="size-4 animate-spin" /> : "Generate"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>You&apos;ve reached the free plan limit</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Upgrade to Plus for unlimited decks and AI.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeOpen(false)}>
              Maybe later
            </Button>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg bg-[#6C5CE7] px-4 py-2 text-sm font-medium text-white hover:bg-[#5A4BD1]"
            >
              See Plans
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
