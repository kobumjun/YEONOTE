"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText, ImageIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { templateToMarkdown } from "@/lib/export";
import { useEditorStore } from "@/stores/editorStore";
import { toPng } from "html-to-image";

export function ExportMenu({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
  const { title, blocks, templateId } = useEditorStore();
  const [busy, setBusy] = useState(false);

  async function markdown() {
    setBusy(true);
    try {
      const res = await fetch("/api/export/markdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, title, blocks }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Export failed");
      const blob = new Blob([j.markdown], { type: "text/markdown;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${title || "template"}.md`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Markdown downloaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function pdf() {
    setBusy(true);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, title, blocks }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Export failed");
      const binary = atob(j.pdfBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = j.filename ?? "export.pdf";
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("PDF downloaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function png() {
    if (!editorRef.current) return;
    setBusy(true);
    try {
      const res = await fetch("/api/export/markdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, title, blocks }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Export failed");
      }
      const dataUrl = await toPng(editorRef.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${title || "template"}.png`;
      a.click();
      toast.success("PNG downloaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function jsonExport() {
    const blob = new Blob([JSON.stringify({ title, blocks }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title || "template"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("JSON downloaded.");
  }

  function mdLocal() {
    const md = templateToMarkdown(title, blocks);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title || "template"}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Markdown downloaded (local).");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl border-border shadow-sm")}
        disabled={busy}
      >
        <Download className="mr-1 size-4 stroke-[1.5]" />
        Export
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xl border-border">
        <DropdownMenuItem onClick={markdown}>
          <FileText className="mr-2 size-4 stroke-[1.5]" /> Markdown (server)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={mdLocal}>
          <FileText className="mr-2 size-4 stroke-[1.5]" /> Markdown (local)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={pdf}>
          <FileText className="mr-2 size-4 stroke-[1.5]" /> PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={png}>
          <ImageIcon className="mr-2 size-4 stroke-[1.5]" /> PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={jsonExport}>JSON</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
