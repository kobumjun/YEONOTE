"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { createBlock, type InsertableBlockType } from "@/lib/block-factory";

export type SlashCommandHandle = {
  open: () => void;
  close: () => void;
};

const groups: { label: string; items: { type: InsertableBlockType; label: string }[] }[] = [
  {
    label: "Text",
    items: [
      { type: "heading1", label: "Heading 1" },
      { type: "heading2", label: "Heading 2" },
      { type: "heading3", label: "Heading 3" },
      { type: "paragraph", label: "Paragraph" },
      { type: "quote", label: "Quote" },
      { type: "divider", label: "Divider" },
    ],
  },
  {
    label: "Lists",
    items: [
      { type: "bulleted_list", label: "Bulleted list" },
      { type: "numbered_list", label: "Numbered list" },
      { type: "to_do", label: "To-do" },
      { type: "toggle", label: "Toggle" },
    ],
  },
  {
    label: "Media & databases",
    items: [
      { type: "callout", label: "Callout" },
      { type: "code", label: "Code" },
      { type: "image", label: "Image" },
      { type: "bookmark", label: "Bookmark" },
      { type: "database_table", label: "Database · Table" },
      { type: "database_board", label: "Database · Board" },
      { type: "database_calendar", label: "Database · Calendar" },
      { type: "database_gallery", label: "Database · Gallery" },
      { type: "columns", label: "Columns" },
      { type: "embed", label: "Embed" },
    ],
  },
];

export const SlashCommand = forwardRef<
  SlashCommandHandle,
  { onInsert: (block: ReturnType<typeof createBlock>) => void; showTrigger?: boolean }
>(function SlashCommand({ onInsert, showTrigger = true }, ref) {
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
  }));

  return (
    <>
      {showTrigger && (
        <Button type="button" variant="outline" size="sm" className="gap-1 rounded-xl border-border shadow-sm" onClick={() => setOpen(true)}>
          <Plus className="size-4 stroke-[1.5]" />
          + Add Block <span className="hidden text-muted-foreground sm:inline">( / )</span>
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-lg sm:rounded-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Insert block</DialogTitle>
          </DialogHeader>
          <Command className="rounded-lg border-0">
            <CommandInput placeholder="Search blocks…" />
            <CommandList className="max-h-72">
              <CommandEmpty>No results.</CommandEmpty>
              {groups.map((g) => (
                <CommandGroup key={g.label} heading={g.label}>
                  {g.items.map((item) => (
                    <CommandItem
                      key={item.type}
                      value={item.label}
                      onSelect={() => {
                        onInsert(createBlock(item.type));
                        setOpen(false);
                      }}
                    >
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
});
