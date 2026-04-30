"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { createBlock, type InsertableBlockType } from "@/lib/block-factory";

const groups: { label: string; items: { type: InsertableBlockType; label: string }[] }[] = [
  {
    label: "텍스트",
    items: [
      { type: "heading1", label: "제목 1" },
      { type: "heading2", label: "제목 2" },
      { type: "heading3", label: "제목 3" },
      { type: "paragraph", label: "문단" },
      { type: "quote", label: "인용" },
      { type: "divider", label: "구분선" },
    ],
  },
  {
    label: "목록",
    items: [
      { type: "bulleted_list", label: "글머리 기호" },
      { type: "numbered_list", label: "번호 목록" },
      { type: "to_do", label: "할 일" },
      { type: "toggle", label: "토글" },
    ],
  },
  {
    label: "미디어 & DB",
    items: [
      { type: "callout", label: "콜아웃" },
      { type: "code", label: "코드" },
      { type: "image", label: "이미지" },
      { type: "bookmark", label: "북마크" },
      { type: "database_table", label: "데이터베이스 · 표" },
      { type: "database_board", label: "데이터베이스 · 보드" },
      { type: "database_calendar", label: "데이터베이스 · 캘린더" },
      { type: "database_gallery", label: "데이터베이스 · 갤러리" },
      { type: "columns", label: "열 레이아웃" },
      { type: "embed", label: "임베드" },
    ],
  },
];

export function SlashCommand({ onInsert }: { onInsert: (block: ReturnType<typeof createBlock>) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="gap-1 rounded-lg" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        블록 추가
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>블록 삽입</DialogTitle>
          </DialogHeader>
          <Command className="rounded-lg border-0">
            <CommandInput placeholder="블록 검색…" />
            <CommandList className="max-h-72">
              <CommandEmpty>결과 없음</CommandEmpty>
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
}
