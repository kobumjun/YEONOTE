"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CreationType, ImageContent, PresentationContent, PresentationSlide } from "@/types/template";
import { normalizePresentationSlides, presentationToPlainText } from "@/types/template";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ResultToolbar, DownloadTrigger } from "@/components/creation/ResultToolbar";
import { PresentationEditor } from "@/components/creation/PresentationEditor";

export function CreationViewer({
  templateId,
  title: initialTitle,
  type,
  content,
  aiPrompt,
  isDeleted,
  readOnly: readOnlyProp,
}: {
  templateId: string;
  title: string;
  type: CreationType;
  content: unknown;
  aiPrompt: string | null;
  isDeleted?: boolean;
  /** Public share view: no save, regenerate, or delete */
  readOnly?: boolean;
}) {
  const readOnly = Boolean(readOnlyProp);
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [copied, setCopied] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState("");
  const [regenBusy, setRegenBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const presentationContent = useMemo(
    () => ((type === "presentation" ? content : { slides: [] }) ?? { slides: [] }) as PresentationContent,
    [content, type]
  );
  const imageContent = useMemo(
    () => ((type === "image" ? content : { imageUrl: "" }) ?? { imageUrl: "" }) as ImageContent,
    [content, type]
  );

  const [slides, setSlides] = useState<PresentationSlide[]>(() =>
    normalizePresentationSlides(presentationContent.slides ?? [])
  );
  const [imageUrl, setImageUrl] = useState(imageContent.imageUrl ?? "");

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    if (type === "presentation") {
      setSlides(normalizePresentationSlides(presentationContent.slides ?? []));
    }
  }, [type, presentationContent.slides]);

  useEffect(() => {
    if (type === "image") setImageUrl(imageContent.imageUrl ?? "");
  }, [type, imageContent.imageUrl]);

  const saveMeta = useCallback(async () => {
    const res = await fetch(`/api/templates/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error((j as { error?: string }).error ?? "Failed to save");
    }
  }, [templateId, title]);

  const savePresentation = useCallback(async () => {
    const res = await fetch(`/api/templates/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { title, slides },
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error((j as { error?: string }).error ?? "Failed to save");
    }
  }, [templateId, title, slides]);

  const saveImage = useCallback(async () => {
    const res = await fetch(`/api/templates/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { imageUrl, prompt: imageContent.prompt },
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error((j as { error?: string }).error ?? "Failed to save");
    }
  }, [templateId, imageUrl, imageContent.prompt]);

  useEffect(() => {
    if (readOnly || type !== "presentation" || isDeleted) return;
    const t = setTimeout(() => {
      savePresentation().catch((e) => toast.error(e instanceof Error ? e.message : "Autosave failed"));
    }, 600);
    return () => clearTimeout(t);
  }, [readOnly, type, isDeleted, savePresentation]);

  useEffect(() => {
    if (readOnly || type !== "image" || isDeleted) return;
    const t = setTimeout(() => {
      saveImage().catch((e) => toast.error(e instanceof Error ? e.message : "Autosave failed"));
    }, 600);
    return () => clearTimeout(t);
  }, [readOnly, type, isDeleted, saveImage]);

  useEffect(() => {
    if (readOnly || type !== "presentation" || isDeleted) return;
    const t = setTimeout(() => {
      saveMeta().catch((e) => toast.error(e instanceof Error ? e.message : "Failed to save title"));
    }, 600);
    return () => clearTimeout(t);
  }, [readOnly, type, isDeleted, title, saveMeta]);

  async function handleCopy() {
    try {
      if (type === "presentation") {
        await navigator.clipboard.writeText(presentationToPlainText(slides));
      } else if (type === "image") {
        await navigator.clipboard.writeText(imageUrl || "");
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Could not copy.");
    }
  }

  async function exportPresentationPptx() {
    if (type !== "presentation") return;
    const res = await fetch("/api/export/pptx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slides }),
    });
    if (!res.ok) return;
    const j = await res.json();
    if (typeof j.pptxBase64 === "string") {
      const bytes = Uint8Array.from(atob(j.pptxBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
      downloadBlob(blob, j.filename || `${title}.pptx`);
    }
  }

  async function runRegenerateCreation() {
    if (!aiPrompt?.trim()) {
      toast.error("No stored prompt — regenerate is unavailable for this item.");
      return;
    }
    setRegenBusy(true);
    try {
      const res = await fetch("/api/ai/regenerate-creation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, feedback: regenPrompt.trim() || undefined }),
      });
      const j = (await res.json()) as {
        error?: string;
        code?: string;
        content?: unknown;
        title?: string;
        creditsRemaining?: number;
        chargedCredits?: number;
      };
      if (!res.ok) {
        if (j.code === "NO_CREDITS") {
          toast.error("Not enough credits.");
          return;
        }
        throw new Error(j.error ?? "Regenerate failed");
      }
      if (typeof j.title === "string") setTitle(j.title);
      if (type === "presentation" && j.content && typeof j.content === "object" && "slides" in j.content) {
        setSlides(normalizePresentationSlides((j.content as { slides: unknown[] }).slides));
      }
      if (type === "image" && j.content && typeof j.content === "object" && "imageUrl" in j.content) {
        setImageUrl(String((j.content as { imageUrl: string }).imageUrl ?? ""));
      }
      setRegenOpen(false);
      setRegenPrompt("");
      toast.success("Regenerated.");
      if (typeof j.creditsRemaining === "number" && typeof j.chargedCredits === "number") {
        toast.message(`Used ${j.chargedCredits} credit(s). ${j.creditsRemaining} left.`);
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Regenerate failed");
    } finally {
      setRegenBusy(false);
    }
  }

  async function moveToTrash() {
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/templates/${templateId}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((j as { error?: string }).error ?? "Failed to delete");
        return;
      }
      toast.success("Moved to Trash.");
      setDeleteOpen(false);
      router.push("/dashboard?view=trash");
    } finally {
      setDeleteBusy(false);
    }
  }

  const regenDisabled = readOnly || !aiPrompt?.trim() || Boolean(isDeleted);

  if (type === "presentation") {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <ResultToolbar
          onCopy={() => void handleCopy()}
          copied={copied}
          downloadSlot={<DownloadTrigger label="PPTX" onClick={() => void exportPresentationPptx()} />}
          extra={
            readOnly ? null : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-xl border border-border shadow-sm"
                  disabled={regenDisabled}
                  onClick={() => setRegenOpen(true)}
                >
                  <Sparkles className="mr-1 size-4 stroke-[1.5]" />
                  Regenerate
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Move to Trash"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4 stroke-[1.5]" />
                </Button>
              </>
            )
          }
        />
        {readOnly ? (
          <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
        ) : (
          <input
            className="mb-6 w-full border-b border-transparent bg-transparent py-1 text-2xl font-semibold outline-none focus-visible:border-border"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={Boolean(isDeleted)}
          />
        )}
        <PresentationEditor slides={slides} onSlidesChange={setSlides} readOnly={readOnly || Boolean(isDeleted)} />

        <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
          <DialogContent className="rounded-xl">
            <DialogHeader>
              <DialogTitle>Regenerate presentation</DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="Optional: extra instructions…"
              value={regenPrompt}
              onChange={(e) => setRegenPrompt(e.target.value)}
              rows={4}
              className="rounded-xl"
            />
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setRegenOpen(false)}>
                Cancel
              </Button>
              <Button
                className="rounded-xl bg-yeo-600 shadow-sm"
                disabled={regenBusy || regenDisabled}
                onClick={() => void runRegenerateCreation()}
              >
                {regenBusy ? "Generating…" : "Regenerate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="rounded-xl">
            <DialogHeader>
              <DialogTitle>Move to Trash?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">You can restore this later from Trash.</p>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setDeleteOpen(false)} disabled={deleteBusy}>
                Cancel
              </Button>
              <Button className="rounded-xl bg-yeo-600 shadow-sm" onClick={() => void moveToTrash()} disabled={deleteBusy}>
                {deleteBusy ? "Moving…" : "Move to Trash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (type === "image") {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <ResultToolbar
          onCopy={() => void handleCopy()}
          copied={copied}
          downloadSlot={<DownloadTrigger label="Download image" onClick={() => downloadUrl(imageUrl, `${title}.png`)} />}
          extra={
            readOnly ? null : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-xl border border-border shadow-sm"
                  disabled={regenDisabled}
                  onClick={() => setRegenOpen(true)}
                >
                  <Sparkles className="mr-1 size-4 stroke-[1.5]" />
                  Regenerate
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Move to Trash"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4 stroke-[1.5]" />
                </Button>
              </>
            )
          }
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- external DALL-E URLs */}
        <img src={imageUrl} alt={title} className="w-full rounded-xl border bg-card object-contain" />

        <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
          <DialogContent className="rounded-xl">
            <DialogHeader>
              <DialogTitle>Regenerate image</DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="Optional: extra instructions…"
              value={regenPrompt}
              onChange={(e) => setRegenPrompt(e.target.value)}
              rows={4}
              className="rounded-xl"
            />
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setRegenOpen(false)}>
                Cancel
              </Button>
              <Button
                className="rounded-xl bg-yeo-600 shadow-sm"
                disabled={regenBusy || regenDisabled}
                onClick={() => void runRegenerateCreation()}
              >
                {regenBusy ? "Generating…" : "Regenerate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="rounded-xl">
            <DialogHeader>
              <DialogTitle>Move to Trash?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">You can restore this later from Trash.</p>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setDeleteOpen(false)} disabled={deleteBusy}>
                Cancel
              </Button>
              <Button className="rounded-xl bg-yeo-600 shadow-sm" onClick={() => void moveToTrash()} disabled={deleteBusy}>
                {deleteBusy ? "Moving…" : "Move to Trash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}
