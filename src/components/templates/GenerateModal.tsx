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
import { normalizeAiTemplate, type CreationType } from "@/types/template";

export function GenerateModal() {
  const router = useRouter();
  const open = useUiStore((s) => s.generateOpen);
  const setOpen = useUiStore((s) => s.setGenerateOpen);
  const { generateStream, streaming } = useAIGenerate();
  const [prompt, setPrompt] = useState("");
  const [progress, setProgress] = useState("");
  const [previewCount, setPreviewCount] = useState(0);
  const [noCreditsOpen, setNoCreditsOpen] = useState(false);
  const [classifiedType, setClassifiedType] = useState<CreationType | null>(null);
  const [estimatedCredits, setEstimatedCredits] = useState<number>(1);
  const [classifying, setClassifying] = useState(false);

  useEffect(() => {
    if (open) {
      setNoCreditsOpen(false);
    }
  }, [open]);

  useEffect(() => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setClassifiedType(null);
      setEstimatedCredits(1);
      return;
    }
    const timer = setTimeout(async () => {
      setClassifying(true);
      try {
        const res = await fetch("/api/ai/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed }),
        });
        const j = await res.json();
        if (res.ok) {
          setClassifiedType(j.creationType ?? null);
          setEstimatedCredits(typeof j.credits === "number" ? j.credits : 1);
        }
      } finally {
        setClassifying(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [prompt]);

  async function onGenerate() {
    if (!prompt.trim()) {
      toast.error("Describe what you want to create.");
      return;
    }
    setProgress("");
    setPreviewCount(0);
    try {
      const result = await generateStream(prompt, {
        onProgress: (m) => setProgress(m),
        onBlock: () => setPreviewCount((c) => c + 1),
      });
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
        saveBody.content = { html: payload.html };
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
                placeholder="e.g., Weekly workout tracker with daily meal logging"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-2 rounded-xl border-border"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {classifying
                  ? "Classifying prompt..."
                  : classifiedType
                    ? `Detected type: ${classifiedType} · This will use ${estimatedCredits} credit(s).`
                    : "Type and cost will be detected automatically before generation."}
              </p>
            </div>
            {streaming && (
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-yeo-600 stroke-[1.5]" />
                  <span>{progress || "Generating..."}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Blocks received: {previewCount}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button className="rounded-xl bg-yeo-600 shadow-sm" onClick={() => void onGenerate()} disabled={streaming}>
              {streaming ? "Generating..." : `Generate (${estimatedCredits} credit${estimatedCredits > 1 ? "s" : ""})`}
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
