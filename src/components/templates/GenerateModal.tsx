"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, FilePlus2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useUiStore } from "@/stores/uiStore";
import { useAIGenerate } from "@/hooks/useAIGenerate";
import { normalizeAiTemplate } from "@/types/template";
import {
  PRO_CREDIT_PACK_CREDITS,
  PRO_CREDIT_PACK_USD,
  TEAM_CREDIT_PACK_CREDITS,
  TEAM_CREDIT_PACK_USD,
} from "@/lib/credits";

const tagOptions = ["Productivity", "Personal", "Business", "Education", "Health", "Finance"];
const styles = ["minimal", "colorful", "corporate", "playful"] as const;

type Step = "choice" | "ai";

export function GenerateModal() {
  const router = useRouter();
  const open = useUiStore((s) => s.generateOpen);
  const setOpen = useUiStore((s) => s.setGenerateOpen);
  const { generateStream, streaming } = useAIGenerate();
  const [step, setStep] = useState<Step>("choice");
  const [prompt, setPrompt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [style, setStyle] = useState<string>("minimal");
  const [progress, setProgress] = useState("");
  const [previewCount, setPreviewCount] = useState(0);
  const [noCreditsOpen, setNoCreditsOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("choice");
      setNoCreditsOpen(false);
    }
  }, [open]);

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function startBlankTemplate() {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blank: true }),
    });
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error ?? "Could not create template");
      return;
    }
    toast.success("Blank template created.");
    setOpen(false);
    router.push(`/template/${j.template.id}`);
    router.refresh();
  }

  async function onGenerate() {
    if (!prompt.trim()) {
      toast.error("Describe the template you want.");
      return;
    }
    setProgress("");
    setPreviewCount(0);
    try {
      const result = await generateStream(prompt, {
        tags,
        style,
        onProgress: (m) => setProgress(m),
        onBlock: () => setPreviewCount((c) => c + 1),
      });
      if (!result) return;

      const normalized = normalizeAiTemplate(result.payload);
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: normalized.title,
          icon: normalized.icon,
          cover: normalized.cover,
          content: { blocks: normalized.blocks },
          tags,
          category: tags[0] ?? null,
          ai_prompt: prompt,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Could not save template");
        return;
      }
      toast.success("Template created.");
      if (typeof result.creditsRemaining === "number") {
        toast.message(`1 credit used. Remaining: ${result.creditsRemaining}`);
      }
      setOpen(false);
      setPrompt("");
      setTags([]);
      setStep("choice");
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

  async function goCheckout(pack: "pro" | "team") {
    try {
      const res = await fetch(`/api/billing/checkout?plan=${pack}`);
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Could not open checkout");
        return;
      }
      if (j.url) window.location.href = j.url as string;
      else toast.error("Checkout URL missing.");
    } catch {
      toast.error("Checkout request failed.");
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-xl border-border">
          <DialogHeader>
            <DialogTitle>{step === "choice" ? "New Template" : "New Template · AI"}</DialogTitle>
          </DialogHeader>
          {step === "choice" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setStep("ai")}
                className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all duration-200 hover:border-yeo-300 hover:shadow-md"
              >
                <Sparkles className="size-8 text-yeo-600 stroke-[1.5]" />
                <span className="font-medium">Generate with AI</span>
                <span className="text-xs text-muted-foreground">
                  Describe what you need. Uses 1 AI credit when generation completes.
                </span>
              </button>
              <button
                type="button"
                onClick={() => void startBlankTemplate()}
                className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all duration-200 hover:border-yeo-300 hover:shadow-md"
              >
                <FilePlus2 className="size-8 text-yeo-600 stroke-[1.5]" />
                <span className="font-medium">Blank Template</span>
                <span className="text-xs text-muted-foreground">
                  Start with a title and empty paragraph. Add blocks with / or the block menu.
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="prompt">Describe the template you want</Label>
                <Textarea
                  id="prompt"
                  rows={5}
                  placeholder="Weekly project management template with task tracker, meeting notes, and sprint planning"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="mt-2 rounded-xl border-border"
                />
              </div>
              <div>
                <Label>Category (optional)</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tagOptions.map((t) => (
                    <Badge
                      key={t}
                      variant={tags.includes(t) ? "default" : "outline"}
                      className="cursor-pointer rounded-lg transition-all duration-200"
                      onClick={() => toggleTag(t)}
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Style (optional)</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {styles.map((s) => (
                    <Badge
                      key={s}
                      variant={style === s ? "default" : "outline"}
                      className="cursor-pointer rounded-lg capitalize transition-all duration-200"
                      onClick={() => setStyle(s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              {streaming && (
                <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-yeo-600 stroke-[1.5]" />
                    <span>{progress || "Generating…"}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Blocks received: {previewCount}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {step === "choice" ? (
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setStep("choice")}>
                  Back
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button className="rounded-xl bg-yeo-600 shadow-sm" onClick={() => void onGenerate()} disabled={streaming}>
                  {streaming ? "Generating…" : "Generate"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noCreditsOpen} onOpenChange={setNoCreditsOpen}>
        <DialogContent className="max-w-md rounded-xl border-border">
          <DialogHeader>
            <DialogTitle>Out of AI credits</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Top up credits to keep generating templates with AI.</p>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button type="button" className="w-full rounded-xl bg-yeo-600 shadow-sm" onClick={() => void goCheckout("pro")}>
              Pro · ${PRO_CREDIT_PACK_USD} · {PRO_CREDIT_PACK_CREDITS} credits — Purchase
            </Button>
            <Button type="button" variant="outline" className="w-full rounded-xl" onClick={() => void goCheckout("team")}>
              Team · ${TEAM_CREDIT_PACK_USD} · {TEAM_CREDIT_PACK_CREDITS} credits — Purchase
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
