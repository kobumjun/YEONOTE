"use client";

import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BlockToolbar({
  onDelete,
  onDuplicate,
}: {
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div className="absolute -left-1 top-1 z-10 flex gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-md" onClick={onDuplicate} aria-label="Duplicate">
        <Copy className="size-3.5" />
      </Button>
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-md text-destructive" onClick={onDelete} aria-label="Delete">
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
