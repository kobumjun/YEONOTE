"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUiStore } from "@/stores/uiStore";
import { useAIGenerate } from "@/hooks/useAIGenerate";
import { normalizeAiTemplate, normalizeDocumentBlocksFromAi } from "@/types/template";
import { GENERATE_MODAL_PREFILL_KEY } from "@/lib/landing-prompt-bridge";
import { cn } from "@/lib/utils";

const PLACEHOLDER_EXAMPLES = [
  "e.g., Write a cover letter for a marketing position",
  "e.g., Create a 10-slide pitch deck for my startup",
  "e.g., Design a poster for a music festival",
  "e.g., Build a weekly project management dashboard",
];

export function GenerateModal() {
  const router = useRouter();
  const open = useUiStore((s) => s.generateOpen);
  const setOpen = useUiStore((s) => s.setGenerateOpen);
  const { generateStream, streaming } = useAIGenerate();
  const [prompt, setPrompt] = useState("");
  const [noCreditsOpen, setNoCreditsOpen] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setNoCreditsOpen(false);
      try {
        const pre = sessionStorage.getItem(GENERATE_MODAL_PREFILL_KEY);
        if (pre) {
          setPrompt(pre);
          sessionStorage.removeItem(GENERATE_MODAL_PREFILL_KEY);
        }
      } catch {
        /* private mode */
      }
    }
  }, [open]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  async function onGenerate() {
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
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveBody),
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Failed to save template");
        return;
      }
      toast.success("Creation saved.");
      if (result.warning) {
        toast.message(result.warning);
      }
      if (result.usedCredit && typeof result.creditsRemaining === "number") {
        toast.message(`Used ${result.chargedCredits} credit(s). ${result.creditsRemaining} credits left.`);
      }
      setOpen(false);
      setPrompt("");
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

  function closeAll() {
    setNoCreditsOpen(false);
    setOpen(false);
  }

  function goCheckout() {
    router.push("/pricing");
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-xl border-border">
          <DialogHeader>
            <DialogTitle>New Creation · AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="prompt">What do you want to create?</Label>
              <Textarea
                id="prompt"
                rows={5}
                placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={streaming}
                className={cn("mt-2 rounded-xl border-border transition-opacity duration-300", streaming && "opacity-60")}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)} disabled={streaming}>
              Close
            </Button>
            <Button className="rounded-xl bg-yeo-600 shadow-sm" onClick={() => void onGenerate()} disabled={streaming}>
              {streaming ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin stroke-[1.5]" />
                  Creating...
                </span>
              ) : (
                "Generate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noCreditsOpen} onOpenChange={setNoCreditsOpen}>
        <DialogContent className="max-w-md rounded-xl border-border">
          <DialogHeader>
            <DialogTitle>Not enough credits</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Buy credits to create documents, presentations, images, and templates.</p>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button type="button" className="w-full rounded-xl bg-yeo-600 shadow-sm" onClick={goCheckout}>
              Get More Credits
            </Button>
            <Button type="button" variant="ghost" className="w-full rounded-xl" onClick={closeAll}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
