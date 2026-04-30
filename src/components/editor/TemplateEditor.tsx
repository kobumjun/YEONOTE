"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Star, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BlockRenderer } from "@/components/editor/BlockRenderer";
import { SlashCommand } from "@/components/editor/SlashCommand";
import { CoverPicker } from "@/components/editor/CoverPicker";
import { IconPicker } from "@/components/editor/IconPicker";
import { ExportMenu } from "@/components/editor/ExportMenu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useEditorStore } from "@/stores/editorStore";
import type { TemplateBlock } from "@/types/template";
import { cn } from "@/lib/utils";

function gradientClass(cover: string | null) {
  const map: Record<string, string> = {
    "gradient-blue": "from-sky-400 to-blue-700",
    "gradient-indigo": "from-indigo-400 to-violet-800",
    "gradient-rose": "from-rose-300 to-pink-700",
    "gradient-yeo": "from-yeo-400 to-yeo-800",
  };
  return map[cover ?? ""] ?? "from-yeo-400 to-yeo-800";
}

function SortableBlock({
  block,
  readOnly,
  onChange,
  onDelete,
  onDuplicate,
}: {
  block: TemplateBlock;
  readOnly?: boolean;
  onChange: (id: string, patch: Partial<TemplateBlock>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled: readOnly,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-60")}>
      <div className="flex gap-1">
        {!readOnly && (
          <button
            type="button"
            className="mt-2 w-6 shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
            aria-label="드래그"
          >
            ⋮⋮
          </button>
        )}
        <div className="min-w-0 flex-1">
          <BlockRenderer
            block={block}
            readOnly={readOnly}
            onChange={onChange}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        </div>
      </div>
    </div>
  );
}

export function TemplateEditor({
  templateId,
  initial,
  readOnly,
}: {
  templateId: string;
  initial: { title: string; icon: string; cover: string | null; blocks: TemplateBlock[]; is_favorited?: boolean };
  readOnly?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const loadFromServer = useEditorStore((s) => s.loadFromServer);
  const title = useEditorStore((s) => s.title);
  const icon = useEditorStore((s) => s.icon);
  const cover = useEditorStore((s) => s.cover);
  const blocks = useEditorStore((s) => s.blocks);
  const dirty = useEditorStore((s) => s.dirty);
  const setMeta = useEditorStore((s) => s.setMeta);
  const setBlocks = useEditorStore((s) => s.setBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const insertBlock = useEditorStore((s) => s.insertBlock);
  const markClean = useEditorStore((s) => s.markClean);

  const [fav, setFav] = useState(initial.is_favorited ?? false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState("");
  const [regenBusy, setRegenBusy] = useState(false);

  useEffect(() => {
    loadFromServer({
      id: templateId,
      title: initial.title,
      icon: initial.icon,
      cover: initial.cover,
      blocks: initial.blocks,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per template id
  }, [templateId]);

  const save = useCallback(async () => {
    const st = useEditorStore.getState();
    const res = await fetch(`/api/templates/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: st.title,
        icon: st.icon,
        cover: st.cover,
        content: { blocks: st.blocks },
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error((j as { error?: string }).error ?? "Save failed");
    }
    markClean();
  }, [templateId, markClean]);

  useEffect(() => {
    if (readOnly || !dirty) return;
    const t = setTimeout(() => {
      save().catch((e) => toast.error(e.message));
    }, 500);
    return () => clearTimeout(t);
  }, [readOnly, dirty, title, icon, cover, blocks, save]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const ids = useMemo(() => blocks.map((b) => b.id), [blocks]);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setBlocks(arrayMove(blocks, oldIndex, newIndex));
  }

  async function toggleFav() {
    const next = !fav;
    const res = await fetch(`/api/templates/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorited: next }),
    });
    if (!res.ok) return;
    setFav(next);
    toast.success(next ? "즐겨찾기에 추가했습니다." : "즐겨찾기를 해제했습니다.");
  }

  async function sharePublic() {
    const res = await fetch(`/api/templates/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_public: true }),
    });
    if (!res.ok) return;
    const url = `${window.location.origin}/share/${templateId}`;
    await navigator.clipboard.writeText(url);
    toast.success("공개 링크를 클립보드에 복사했습니다.");
  }

  async function runRegenerate() {
    if (!regenPrompt.trim()) return;
    setRegenBusy(true);
    try {
      const summary = blocks.map((b) => b.type).join(", ");
      const res = await fetch("/api/ai/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: regenPrompt,
          currentTitle: title,
          currentBlocksSummary: summary,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed");
      useEditorStore.getState().applyAiPayload(j);
      setRegenOpen(false);
      setRegenPrompt("");
      toast.success("템플릿을 다시 생성했습니다.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패");
    } finally {
      setRegenBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← 대시보드
        </Link>
        {!readOnly && <IconPicker value={icon} onChange={(i) => setMeta({ icon: i })} />}
        <Input
          value={title}
          onChange={(e) => setMeta({ title: e.target.value })}
          readOnly={readOnly}
          className="max-w-md border-0 bg-transparent font-heading text-lg font-semibold shadow-none focus-visible:ring-0"
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!readOnly && (
            <>
              <CoverPicker value={cover} onChange={(c) => setMeta({ cover: c })} />
              <Button type="button" variant="ghost" size="icon" onClick={toggleFav} aria-label="Favorite">
                <Star className={cn("size-5", fav && "fill-amber-400 text-amber-500")} />
              </Button>
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={sharePublic}>
                <Share2 className="mr-1 size-4" />
                공유
              </Button>
              <ExportMenu editorRef={editorRef} />
              <Button type="button" variant="secondary" size="sm" className="rounded-lg" onClick={() => setRegenOpen(true)}>
                <Sparkles className="mr-1 size-4" />
                AI로 다시
              </Button>
            </>
          )}
          {dirty && !readOnly && <span className="text-xs text-muted-foreground">저장 중…</span>}
        </div>
      </header>

      <div className={cn("h-36 w-full bg-gradient-to-br", gradientClass(cover))} />

      <ScrollArea className="min-h-0 flex-1">
        <div ref={editorRef} className="mx-auto max-w-3xl px-6 py-10 pb-32">
          {!readOnly && (
            <div className="mb-6">
              <SlashCommand onInsert={(b) => insertBlock(blocks.length, b)} />
            </div>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {blocks.map((block) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    readOnly={readOnly}
                    onChange={updateBlock}
                    onDelete={removeBlock}
                    onDuplicate={duplicateBlock}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </ScrollArea>

      <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI로 템플릿 다시 생성</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="바꾸고 싶은 점을 설명하세요…"
            value={regenPrompt}
            onChange={(e) => setRegenPrompt(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenOpen(false)}>
              취소
            </Button>
            <Button className="bg-yeo-600" onClick={runRegenerate} disabled={regenBusy}>
              {regenBusy ? "생성 중…" : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
