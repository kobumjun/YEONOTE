"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { canExportPptx, pdfHasWatermark, type UserPlan } from "@/lib/subscription";
import { withAuth } from "@/lib/auth-fetch";
import type { PresentationSlide } from "@/types/template";

export function DeckExportMenu({
  plan,
  title,
  slides,
}: {
  plan: UserPlan;
  title: string;
  slides: PresentationSlide[];
}) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  async function exportPptx() {
    if (!canExportPptx(plan)) {
      setUpgradeOpen(true);
      return;
    }
    const res = await fetch(
      "/api/export/pptx",
      await withAuth({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slides }),
      })
    );
    if (!res.ok) return;
    const j = await res.json();
    if (typeof j.pptxBase64 === "string") {
      const bytes = Uint8Array.from(atob(j.pptxBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = j.filename || `${title}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  async function exportPdf() {
    const res = await fetch(
      "/api/export/pdf",
      await withAuth({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slides, watermark: pdfHasWatermark(plan) }),
      })
    );
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-7 items-center gap-1 rounded-xl border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted">
          Export
          <ChevronDown className="ml-1 size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => void exportPdf()}>
            <Download className="mr-2 size-4" />
            Download PDF{pdfHasWatermark(plan) ? " (watermark)" : ""}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void exportPptx()}>
            <Download className="mr-2 size-4" />
            Download PPTX{!canExportPptx(plan) ? " (Plus+)" : ""}
          </DropdownMenuItem>
          <DropdownMenuItem disabled>Download Keynote (Coming soon)</DropdownMenuItem>
          <DropdownMenuItem disabled>Sync to Google Slides (Coming soon)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Upgrade to Plus</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Export as PPTX with Plus or Pro.</p>
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
