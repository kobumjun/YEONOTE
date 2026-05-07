"use client";

import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BlockToolbar({
  onDelete,
  onDuplicate,
  className,
}: {
  onDelete: () => void;
  onDuplicate: () => void;
  className?: string;
}) {
  return (
    <div className={className ?? "flex items-center gap-1"}>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
        onClick={onDuplicate}
        aria-label="Duplicate"
      >
        <Copy className="size-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive"
        onClick={onDelete}
        aria-label="Delete"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
