"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Copy, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ResultToolbar({
  onCopy,
  copied,
  downloadSlot,
  extra,
  className,
}: {
  onCopy: () => void;
  copied: boolean;
  /** Download button(s); pass null to hide */
  downloadSlot?: ReactNode;
  /** Regenerate, Delete, etc. */
  extra?: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3",
        className
      )}
    >
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 stroke-[1.5]" />
        Back to All Creations
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="rounded-xl border-border" onClick={onCopy}>
          <Copy className="mr-1 size-3.5 stroke-[1.5]" />
          {copied ? "Copied!" : "Copy"}
        </Button>
        {downloadSlot ? (
          <div className="flex flex-wrap items-center gap-2 [&_button]:rounded-xl [&_button]:border-border">{downloadSlot}</div>
        ) : null}
        {extra}
      </div>
    </div>
  );
}

export function DownloadTrigger({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <Button type="button" variant="outline" size="sm" className="rounded-xl border-border" onClick={onClick}>
      <Download className="mr-1 size-3.5 stroke-[1.5]" />
      {label}
    </Button>
  );
}
