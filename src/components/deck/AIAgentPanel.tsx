"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, PanelRightClose, PanelRightOpen, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { withAuth } from "@/lib/auth-fetch";
import {
  canUseAgentAction,
  planLabel,
  type AgentAction,
  type UserPlan,
} from "@/lib/subscription";
import type { PresentationSlide } from "@/types/template";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ChatMessage = { role: "user" | "assistant"; content: string };

const QUICK_ACTIONS: { action: AgentAction; label: string; prompt?: string }[] = [
  { action: "generate_outline", label: "Generate outline" },
  { action: "add_speaker_notes", label: "Add speaker notes" },
  { action: "web_research", label: "Research topic" },
  { action: "review_deck", label: "Review this deck" },
  { action: "rewrite_slide", label: "Rewrite slide" },
];

export function AIAgentPanel({
  deckId,
  plan,
  currentSlideIndex,
  onSlidesUpdate,
  onTitleUpdate,
  collapsed,
  onCollapsedChange,
}: {
  deckId: string;
  plan: UserPlan;
  currentSlideIndex: number;
  onSlidesUpdate: (slides: PresentationSlide[]) => void;
  onTitleUpdate?: (title: string) => void;
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const runAction = useCallback(
    async (action: AgentAction, userPrompt: string) => {
      if (!canUseAgentAction(plan, action)) {
        setUpgradeMessage("This feature requires Plus or Pro.");
        setUpgradeOpen(true);
        return;
      }
      setBusy(true);
      setMessages((m) => [...m, { role: "user", content: userPrompt || action }]);
      try {
        const res = await fetch(
          "/api/ai/agent",
          await withAuth({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              deckId,
              action,
              prompt: userPrompt,
              currentSlideIndex,
            }),
          })
        );
        const j = (await res.json()) as {
          error?: string;
          code?: string;
          message?: string;
          updatedSlides?: PresentationSlide[];
          updatedTitle?: string;
        };
        if (!res.ok) {
          if (j.code === "upgrade_required" || j.code === "daily_limit") {
            setUpgradeMessage(j.error ?? "Limit reached.");
            setUpgradeOpen(true);
            return;
          }
          throw new Error(j.error ?? "Request failed");
        }
        if (j.updatedSlides) onSlidesUpdate(j.updatedSlides);
        if (j.updatedTitle && onTitleUpdate) onTitleUpdate(j.updatedTitle);
        setMessages((m) => [...m, { role: "assistant", content: j.message ?? "Done." }]);
        setPrompt("");
      } catch (e) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong." },
        ]);
      } finally {
        setBusy(false);
        requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
      }
    },
    [deckId, plan, currentSlideIndex, onSlidesUpdate, onTitleUpdate]
  );

  if (collapsed) {
    return (
      <div className="flex w-12 shrink-0 flex-col items-center border-l border-border bg-[#F8F7FF] py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open AI panel"
          onClick={() => onCollapsedChange(false)}
        >
          <PanelRightOpen className="size-5 text-[#6C5CE7]" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <aside className="flex w-[30%] min-w-[280px] max-w-[400px] shrink-0 flex-col border-l border-border bg-[#F8F7FF]">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold text-[#6C5CE7]">AI Agent</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">{planLabel(plan)}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Collapse panel"
              onClick={() => onCollapsedChange(true)}
            >
              <PanelRightClose className="size-4" />
            </Button>
          </div>
        </div>

        <div className="border-b border-border p-3">
          <Textarea
            placeholder="Ask AI anything…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            className="resize-none rounded-xl border-border bg-white text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (prompt.trim() && !busy) void runAction("rewrite_slide", prompt.trim());
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            className="mt-2 w-full rounded-xl bg-[#6C5CE7] text-white hover:bg-[#5A4BD1]"
            disabled={busy || !prompt.trim()}
            onClick={() => void runAction("rewrite_slide", prompt.trim())}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            <span className="ml-2">Send</span>
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-border px-3 py-2">
          {QUICK_ACTIONS.map(({ action, label }) => {
            const allowed = canUseAgentAction(plan, action);
            return (
              <button
                key={action}
                type="button"
                disabled={busy}
                onClick={() => void runAction(action, prompt.trim() || label)}
                className={cn(
                  "rounded-lg px-2 py-1 text-[11px] font-medium transition-colors",
                  allowed
                    ? "bg-white text-[#6C5CE7] shadow-sm hover:bg-[#6C5CE7]/10"
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Try: &quot;이 덱을 10분 발표용으로 대본 만들어줘&quot; or &quot;슬라이드 3에 최신 시장 데이터 넣어줘&quot;
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
                msg.role === "user"
                  ? "ml-4 bg-[#6C5CE7] text-white"
                  : "mr-4 bg-white text-foreground shadow-sm"
              )}
            >
              {msg.content}
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Thinking…
            </div>
          )}
        </div>
      </aside>

      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>You&apos;ve reached the free plan limit</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{upgradeMessage}</p>
          <p className="text-sm">Upgrade to Plus for unlimited access.</p>
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
    </>
  );
}
