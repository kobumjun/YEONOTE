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
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Share2, Sparkles, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BlockRenderer } from "@/components/editor/BlockRenderer";
import { BlockToolbar } from "@/components/editor/BlockToolbar";
import { SlashCommand, type SlashCommandHandle } from "@/components/editor/SlashCommand";
import { createBlock } from "@/lib/block-factory";
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
import { Switch } from "@/components/ui/switch";
import { useEditorStore } from "@/stores/editorStore";
import type { AITemplatePayload, DatabaseRow, TemplateBlock } from "@/types/template";
import {
  collectHiddenRootIdsForMasterView,
  collectLinkedSectionTargets,
  getDetailRootIdsForLinkedSection,
  getEffectiveLinkedSectionId,
  instantiateDetailTemplate,
} from "@/types/template";
import { cn } from "@/lib/utils";

function gradientClass(cover: string | null) {
  const map: Record<string, string> = {
    "gradient-blue": "from-slate-200 to-slate-600",
    "gradient-indigo": "from-violet-200 to-violet-700",
    "gradient-rose": "from-rose-200 to-rose-600",
    "gradient-yeo": "from-yeo-200 to-yeo-700",
  };
  return map[cover ?? ""] ?? "from-yeo-200 to-yeo-700";
}

interface PageView {
  id: string;
  title: string;
  blockIds: string[];
  /** Cloned page blocks (not in store) */
  ephemeralBlocks: TemplateBlock[] | null;
  sourceAnchorId?: string;
}

function mapBlocksDeep(blocks: TemplateBlock[], mapper: (b: TemplateBlock) => TemplateBlock): TemplateBlock[] {
  const walk = (b: TemplateBlock): TemplateBlock => {
    const next = mapper(b);
    switch (next.type) {
      case "toggle":
      case "sub_page":
      case "linked_page":
        return { ...next, children: next.children.map(walk) };
      case "columns":
        return { ...next, children: next.children.map((col) => col.map(walk)) };
      case "database_table":
        if (!next.detailTemplate?.blocks?.length) return next;
        return {
          ...next,
          detailTemplate: { blocks: next.detailTemplate.blocks.map(walk) },
        };
      default:
        return next;
    }
  };
  return blocks.map(walk);
}

function removeBlockDeep(blocks: TemplateBlock[], id: string): TemplateBlock[] {
  const walk = (list: TemplateBlock[]): TemplateBlock[] =>
    list
      .filter((b) => b.id !== id)
      .map((b) => {
        switch (b.type) {
          case "toggle":
          case "sub_page":
          case "linked_page":
            return { ...b, children: walk(b.children) };
          case "columns":
            return { ...b, children: b.children.map((col) => walk(col)) };
          case "database_table":
            if (!b.detailTemplate?.blocks?.length) return b;
            return {
              ...b,
              detailTemplate: { blocks: walk(b.detailTemplate.blocks) },
            };
          default:
            return b;
        }
      });
  return walk(blocks);
}

function duplicateBlockDeep(blocks: TemplateBlock[], id: string): TemplateBlock[] {
  const walk = (list: TemplateBlock[]): TemplateBlock[] => {
    const out: TemplateBlock[] = [];
    for (const b of list) {
      let next: TemplateBlock = b;
      switch (b.type) {
        case "toggle":
        case "sub_page":
        case "linked_page":
          next = { ...b, children: walk(b.children) };
          break;
        case "columns":
          next = { ...b, children: b.children.map((col) => walk(col)) };
          break;
        case "database_table":
          next = b.detailTemplate?.blocks?.length
            ? { ...b, detailTemplate: { blocks: walk(b.detailTemplate.blocks) } }
            : b;
          break;
      }
      out.push(next);
      if (next.id === id) {
        // Keep duplicate editable in-memory by giving a fresh deterministic-ish id.
        out.push({ ...next, id: `${next.id}-${Date.now()}` });
      }
    }
    return out;
  };
  return walk(blocks);
}

function insertParagraphAfterDeep(blocks: TemplateBlock[], id: string): TemplateBlock[] {
  const walk = (list: TemplateBlock[]): TemplateBlock[] => {
    const out: TemplateBlock[] = [];
    for (const b of list) {
      let next: TemplateBlock = b;
      switch (b.type) {
        case "toggle":
        case "sub_page":
        case "linked_page":
          next = { ...b, children: walk(b.children) };
          break;
        case "columns":
          next = { ...b, children: b.children.map((col) => walk(col)) };
          break;
        case "database_table":
          next = b.detailTemplate?.blocks?.length
            ? { ...b, detailTemplate: { blocks: walk(b.detailTemplate.blocks) } }
            : b;
          break;
      }
      out.push(next);
      if (next.id === id) {
        out.push(createBlock("paragraph"));
      }
    }
    return out;
  };
  return walk(blocks);
}

function SortableBlock({
  block,
  readOnly,
  onChange,
  onDelete,
  onDuplicate,
  onEnter,
  onOpenTableRowDetail,
  onOpenNestedPage,
}: {
  block: TemplateBlock;
  readOnly?: boolean;
  onChange: (id: string, patch: Partial<TemplateBlock>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onEnter: (id: string) => void;
  onOpenTableRowDetail?: (ctx: {
    parentTableBlockId: string;
    row: DatabaseRow;
    rowTitle: string;
    source: "linked" | "template";
  }) => void;
  onOpenNestedPage?: (ctx: { id: string; title: string; blocks: TemplateBlock[] }) => void;
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
    <div ref={setNodeRef} style={style} className={cn("group relative", isDragging && "opacity-60")}>
      {!readOnly && (
        <>
          <div className="mb-1 flex items-center gap-1 md:hidden">
            <button
              type="button"
              className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground"
              {...attributes}
              {...listeners}
              aria-label="Drag to reorder"
            >
              <span className="text-sm leading-none">⠿</span>
            </button>
            <BlockToolbar onDelete={() => onDelete(block.id)} onDuplicate={() => onDuplicate(block.id)} />
          </div>

          <div className="pointer-events-none absolute left-0 top-1/2 hidden -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 md:flex">
            <button
              type="button"
              className="pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
              {...attributes}
              {...listeners}
              aria-label="Drag to reorder"
            >
              <span className="text-sm leading-none">⠿</span>
            </button>
            <BlockToolbar
              className="pointer-events-auto flex items-center gap-1"
              onDelete={() => onDelete(block.id)}
              onDuplicate={() => onDuplicate(block.id)}
            />
          </div>
        </>
      )}
      <div className={cn("min-w-0", !readOnly && "md:pl-20")}>
        <div className="min-w-0 flex-1">
          <BlockRenderer
            block={block}
            readOnly={readOnly}
            onChange={onChange}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onEnter={onEnter}
            onOpenTableRowDetail={onOpenTableRowDetail}
            onOpenNestedPage={onOpenNestedPage}
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
  initial: {
    title: string;
    icon: string;
    cover: string | null;
    blocks: TemplateBlock[];
    is_favorited?: boolean;
    is_public?: boolean;
    is_deleted?: boolean;
  };
  readOnly?: boolean;
}) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const slashRef = useRef<SlashCommandHandle>(null);
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
  const [isPublic, setIsPublic] = useState(initial.is_public ?? false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState("");
  const [regenBusy, setRegenBusy] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [inTrash, setInTrash] = useState(Boolean(initial.is_deleted));
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [pageStack, setPageStack] = useState<PageView[]>([]);
  const currentPage = pageStack.length > 0 ? pageStack[pageStack.length - 1] : null;

  const linkedTargets = useMemo(() => collectLinkedSectionTargets(blocks), [blocks]);
  const hiddenMasterRootIds = useMemo(
    () => collectHiddenRootIdsForMasterView(blocks, linkedTargets),
    [blocks, linkedTargets]
  );
  const masterBlocks = useMemo(
    () => blocks.filter((b) => !hiddenMasterRootIds.has(b.id)),
    [blocks, hiddenMasterRootIds]
  );

  const openTableRowDetail = useCallback(
    (ctx: {
      parentTableBlockId: string;
      row: DatabaseRow;
      rowTitle: string;
      source: "linked" | "template";
    }) => {
      const tbl = blocks.find((b) => b.id === ctx.parentTableBlockId);
      if (!tbl || tbl.type !== "database_table") return;

      if (ctx.source === "linked") {
        const lid = getEffectiveLinkedSectionId(ctx.row, tbl.columns);
        if (!lid) return;
        const chain = getDetailRootIdsForLinkedSection(lid, blocks, linkedTargets);
        if (chain.length === 0) {
          toast.message("Could not find linked detail blocks. Check the row link ID.");
          return;
        }
        setPageStack((prev) => [
          ...prev,
          {
            id: `${ctx.parentTableBlockId}-linked-${lid}`,
            title: ctx.rowTitle || "Detail",
            blockIds: chain,
            ephemeralBlocks: null,
            sourceAnchorId: ctx.parentTableBlockId,
          },
        ]);
      } else {
        if (!tbl.detailTemplate?.blocks?.length) return;
        const inst = instantiateDetailTemplate(tbl.detailTemplate, ctx.rowTitle || "Item");
        setPageStack((prev) => [
          ...prev,
          {
            id: `${ctx.parentTableBlockId}-template-${ctx.rowTitle}`,
            title: ctx.rowTitle || "Detail",
            blockIds: [],
            ephemeralBlocks: inst,
            sourceAnchorId: ctx.parentTableBlockId,
          },
        ]);
      }

      requestAnimationFrame(() => {
        const viewport = editorRef.current?.closest("[data-radix-scroll-area-viewport]");
        if (viewport instanceof HTMLElement) viewport.scrollTo({ top: 0, behavior: "smooth" });
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    },
    [blocks, linkedTargets]
  );

  const pushNestedPage = useCallback((ctx: { id: string; title: string; blocks: TemplateBlock[] }) => {
    setPageStack((prev) => [
      ...prev,
      { id: ctx.id, title: ctx.title, blockIds: [], ephemeralBlocks: ctx.blocks },
    ]);
    requestAnimationFrame(() => {
      const viewport = editorRef.current?.closest("[data-radix-scroll-area-viewport]");
      if (viewport instanceof HTMLElement) viewport.scrollTo({ top: 0, behavior: "smooth" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, []);

  const updateCurrentPageBlock = useCallback((id: string, patch: Partial<TemplateBlock>) => {
    setPageStack((prev) => {
      if (prev.length === 0) return prev;
      const idx = prev.length - 1;
      const page = prev[idx];
      if (!page.ephemeralBlocks?.length) return prev;
      const nextPage: PageView = {
        ...page,
        ephemeralBlocks: mapBlocksDeep(page.ephemeralBlocks, (b) =>
          b.id === id ? ({ ...b, ...patch } as TemplateBlock) : b
        ),
      };
      return [...prev.slice(0, idx), nextPage];
    });
  }, []);

  const removeCurrentPageBlock = useCallback((id: string) => {
    setPageStack((prev) => {
      if (prev.length === 0) return prev;
      const idx = prev.length - 1;
      const page = prev[idx];
      if (!page.ephemeralBlocks?.length) return prev;
      const nextPage: PageView = { ...page, ephemeralBlocks: removeBlockDeep(page.ephemeralBlocks, id) };
      return [...prev.slice(0, idx), nextPage];
    });
  }, []);

  const duplicateCurrentPageBlock = useCallback((id: string) => {
    setPageStack((prev) => {
      if (prev.length === 0) return prev;
      const idx = prev.length - 1;
      const page = prev[idx];
      if (!page.ephemeralBlocks?.length) return prev;
      const nextPage: PageView = { ...page, ephemeralBlocks: duplicateBlockDeep(page.ephemeralBlocks, id) };
      return [...prev.slice(0, idx), nextPage];
    });
  }, []);

  const insertParagraphAfterCurrentPageBlock = useCallback((id: string) => {
    setPageStack((prev) => {
      if (prev.length === 0) return prev;
      const idx = prev.length - 1;
      const page = prev[idx];
      if (!page.ephemeralBlocks?.length) return prev;
      const nextPage: PageView = { ...page, ephemeralBlocks: insertParagraphAfterDeep(page.ephemeralBlocks, id) };
      return [...prev.slice(0, idx), nextPage];
    });
  }, []);

  const popPage = useCallback(() => {
    setPageStack((prev) => {
      const popped = prev[prev.length - 1];
      const next = prev.slice(0, -1);
      const anchorId = next.length === 0 ? popped?.sourceAnchorId : undefined;
      requestAnimationFrame(() => {
        if (anchorId) {
          const viewport = editorRef.current?.closest("[data-radix-scroll-area-viewport]");
          const anchor = document.getElementById(`yeo-block-${anchorId}`);
          if (anchor && viewport instanceof HTMLElement) {
            const top =
              anchor.getBoundingClientRect().top -
              viewport.getBoundingClientRect().top +
              viewport.scrollTop;
            viewport.scrollTo({ top: Math.max(0, top - 16), behavior: "smooth" });
          } else {
            anchor?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
      return next;
    });
  }, []);

  useEffect(() => {
    setPageStack([]);
  }, [templateId]);

  useEffect(() => {
    if (!currentPage) return;
    if (currentPage.ephemeralBlocks && currentPage.ephemeralBlocks.length > 0) return;
    if (currentPage.blockIds.length === 0) return;
    const ok = currentPage.blockIds.every((id) => blocks.some((b) => b.id === id));
    if (!ok) {
      setPageStack((prev) => prev.slice(0, -1));
    }
  }, [blocks, currentPage]);

  useEffect(() => {
    setInTrash(Boolean(initial.is_deleted));
  }, [templateId, initial.is_deleted]);

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

  useEffect(() => {
    if (readOnly || Boolean(currentPage)) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      setInsertIndex(masterBlocks.length);
      slashRef.current?.open();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readOnly, masterBlocks.length, currentPage]);

  useEffect(() => {
    if (!readOnly && insertIndex === null && !currentPage) setInsertIndex(masterBlocks.length);
  }, [masterBlocks.length, readOnly, insertIndex, currentPage]);

  useEffect(() => {
    setIsPublic(initial.is_public ?? false);
  }, [templateId, initial.is_public]);

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
      throw new Error((j as { error?: string }).error ?? "Failed to save");
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
  const ids = useMemo(() => masterBlocks.map((b) => b.id), [masterBlocks]);

  function masterIndexToFullInsertPosition(masterIdx: number): number {
    if (masterBlocks.length === 0) return blocks.length;
    if (masterIdx <= 0) {
      const first = masterBlocks[0];
      return Math.max(0, blocks.findIndex((b) => b.id === first.id));
    }
    if (masterIdx >= masterBlocks.length) {
      const last = masterBlocks[masterBlocks.length - 1];
      return blocks.findIndex((b) => b.id === last.id) + 1;
    }
    const target = masterBlocks[masterIdx];
    return Math.max(0, blocks.findIndex((b) => b.id === target.id));
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setBlocks(arrayMove(blocks, oldIndex, newIndex));
  }

  function openInsertAt(index: number) {
    setInsertIndex(index);
    slashRef.current?.open();
  }

  function insertParagraphAfter(blockId: string) {
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx < 0) return;
    insertBlock(idx + 1, createBlock("paragraph"));
    setInsertIndex(idx + 2);
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
    toast.success(next ? "Added to favorites." : "Removed from favorites.");
  }

  async function sharePublic() {
    setShareOpen(true);
  }

  async function setPublic(next: boolean) {
    setShareBusy(true);
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error((j as { error?: string }).error ?? "Failed to update visibility settings.");
        return;
      }
      const j = (await res.json().catch(() => ({}))) as { template?: { is_public?: boolean } };
      const resolved = typeof j.template?.is_public === "boolean" ? j.template.is_public : next;
      setIsPublic(resolved);
      toast.success(resolved ? "Published to Explore." : "Set to private.");
    } catch {
      toast.error("Failed to update visibility settings.");
    } finally {
      setShareBusy(false);
    }
  }

  async function copyShareLink() {
    const url = `https://yeonote.vercel.app/shared/${templateId}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied.");
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

  async function restoreFromTrash() {
    const res = await fetch(`/api/templates/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_deleted: false }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((j as { error?: string }).error ?? "Failed to restore");
      return;
    }
    setInTrash(false);
    toast.success("Restored from Trash.");
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
      const j = (await res.json()) as AITemplatePayload & {
        error?: string;
        code?: string;
        creditsRemaining?: number;
        usedCredit?: boolean;
        warning?: string;
      };
      if (!res.ok) {
        if (j.code === "NO_CREDITS") {
          toast.error("No AI credits left. Please top up in Billing.");
          return;
        }
        throw new Error(j.error ?? "Request failed");
      }
      const { creditsRemaining, usedCredit, warning, ...payload } = j;
      useEditorStore.getState().applyAiPayload(payload as AITemplatePayload);
      setRegenOpen(false);
      setRegenPrompt("");
      toast.success("Template regenerated.");
      if (warning) {
        toast.message(warning);
      }
      if (usedCredit !== false && typeof creditsRemaining === "number") {
        toast.message(`Used 1 credit. ${creditsRemaining} credits left.`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setRegenBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link href="/dashboard" className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
          ← Dashboard
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
              <Button type="button" variant="ghost" size="icon" onClick={toggleFav} aria-label="Favorites" disabled={inTrash}>
                <Star className={cn("size-5", fav && "fill-amber-400 text-amber-500")} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-border shadow-sm"
                onClick={sharePublic}
                disabled={inTrash}
              >
                <Share2 className="mr-1 size-4 stroke-[1.5]" />
                Share
              </Button>
              <ExportMenu editorRef={editorRef} />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-xl border border-border shadow-sm"
                onClick={() => setRegenOpen(true)}
                disabled={inTrash}
              >
                <Sparkles className="mr-1 size-4 stroke-[1.5]" />
                Regenerate
              </Button>
              {inTrash ? (
                <Button type="button" variant="outline" size="sm" className="rounded-xl border-border" onClick={() => void restoreFromTrash()}>
                  Restore from Trash
                </Button>
              ) : (
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
              )}
            </>
          )}
          {dirty && !readOnly && <span className="text-xs text-muted-foreground">Saving...</span>}
        </div>
      </header>

      {inTrash && !readOnly && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-950 dark:text-amber-100">
          This template is in Trash. Restore it here or manage it in the Trash view.
        </div>
      )}

      <div className={cn("h-36 w-full bg-gradient-to-br", gradientClass(cover))} />

      <ScrollArea className="min-h-0 flex-1">
        <div ref={editorRef} className={cn("mx-auto px-6 py-10 pb-32", currentPage ? "max-w-4xl" : "max-w-3xl")}>
          {currentPage ? (
            <div className="yeo-subpage-enter space-y-6">
              <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                <button type="button" onClick={() => setPageStack([])} className="rounded px-1.5 py-0.5 hover:bg-muted hover:text-foreground">
                  Main
                </button>
                {pageStack.map((page, i) => (
                  <span key={page.id} className="inline-flex items-center gap-1">
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => setPageStack((prev) => prev.slice(0, i + 1))}
                      className={cn(
                        "rounded px-1.5 py-0.5",
                        i === pageStack.length - 1 ? "font-medium text-foreground" : "hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {page.title}
                    </button>
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={popPage}
                className="inline-flex items-center gap-1.5 rounded-md py-1.5 pl-1 pr-3 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="size-4 shrink-0" aria-hidden />
                Back
              </button>
              <h2 className="font-heading text-2xl font-bold text-surface-dark dark:text-white">{currentPage.title}</h2>
              <div className="space-y-1">
                {(currentPage.ephemeralBlocks ??
                  currentPage.blockIds
                    .map((id) => blocks.find((x) => x.id === id))
                    .filter((b): b is TemplateBlock => b != null)
                ).map((b) => (
                  <BlockRenderer
                    key={b.id}
                    block={b}
                    readOnly={readOnly}
                    onChange={currentPage.ephemeralBlocks?.length ? updateCurrentPageBlock : updateBlock}
                    onDelete={currentPage.ephemeralBlocks?.length ? removeCurrentPageBlock : removeBlock}
                    onDuplicate={currentPage.ephemeralBlocks?.length ? duplicateCurrentPageBlock : duplicateBlock}
                    onEnter={currentPage.ephemeralBlocks?.length ? insertParagraphAfterCurrentPageBlock : insertParagraphAfter}
                    onOpenTableRowDetail={openTableRowDetail}
                    onOpenNestedPage={pushNestedPage}
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              {!readOnly && (
                <div className="mb-6">
                  <SlashCommand
                    ref={slashRef}
                    onInsert={(b) => {
                      const masterIdx = insertIndex ?? masterBlocks.length;
                      const fullPos = masterIndexToFullInsertPosition(masterIdx);
                      insertBlock(fullPos, b);
                      setInsertIndex(masterIdx + 1);
                    }}
                  />
                </div>
              )}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {masterBlocks.map((block, i) => (
                      <div key={block.id}>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => openInsertAt(i)}
                            className="group/insert relative my-1 hidden h-4 w-full items-center md:flex"
                            aria-label={`${i + 1}Insert block above position `}
                          >
                            <span className="h-px w-full bg-border/60 opacity-0 transition-all group-hover/insert:opacity-100 group-hover/insert:bg-yeo-400/70" />
                            <span className="absolute left-1/2 top-1/2 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground opacity-0 transition-opacity group-hover/insert:opacity-100">
                              <Plus className="size-3.5" />
                            </span>
                          </button>
                        )}
                        <SortableBlock
                          block={block}
                          readOnly={readOnly}
                          onChange={updateBlock}
                          onDelete={removeBlock}
                          onDuplicate={duplicateBlock}
                          onEnter={insertParagraphAfter}
                          onOpenTableRowDetail={openTableRowDetail}
                          onOpenNestedPage={pushNestedPage}
                        />
                      </div>
                    ))}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => openInsertAt(masterBlocks.length)}
                        className="group/insert relative mt-1 hidden h-4 w-full items-center md:flex"
                        aria-label="Insert block at bottom"
                      >
                        <span className="h-px w-full bg-border/60 opacity-0 transition-all group-hover/insert:opacity-100 group-hover/insert:bg-yeo-400/70" />
                        <span className="absolute left-1/2 top-1/2 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground opacity-0 transition-opacity group-hover/insert:opacity-100">
                          <Plus className="size-3.5" />
                        </span>
                      </button>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>
      </ScrollArea>

      <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate with AI</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Describe what to change..."
            value={regenPrompt}
            onChange={(e) => setRegenPrompt(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setRegenOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl bg-yeo-600 shadow-sm" onClick={runRegenerate} disabled={regenBusy}>
              {regenBusy ? "Generating..." : "Generate"}
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
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDeleteOpen(false)} disabled={deleteBusy}>
              Cancel
            </Button>
            <Button type="button" className="rounded-xl bg-yeo-600 shadow-sm hover:bg-yeo-700" onClick={() => void moveToTrash()} disabled={deleteBusy}>
              {deleteBusy ? "Moving..." : "Move to Trash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
              <label htmlFor="template-share-toggle" className="text-sm text-foreground">
                Public in Explore
              </label>
              <Switch
                id="template-share-toggle"
                checked={isPublic}
                disabled={shareBusy}
                className="h-6 w-11"
                onCheckedChange={(checked) => {
                  void setPublic(Boolean(checked));
                }}
              />
            </div>
            {isPublic ? (
              <div className="rounded-md border bg-muted/10 p-2">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1 break-all text-sm text-foreground">
                    {`https://yeonote.vercel.app/shared/${templateId}`}
                  </div>
                  <Button size="sm" variant="outline" onClick={copyShareLink} disabled={shareBusy}>
                    Copy Link
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">When public, it appears in Explore and can be opened via a shared link.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setShareOpen(false)} disabled={shareBusy}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
