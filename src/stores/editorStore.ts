import { create } from "zustand";
import type { TemplateBlock } from "@/types/template";
import { normalizeAiBlock, normalizeAiTemplate, remapBlockIds, type AITemplatePayload } from "@/types/template";

export type EditorState = {
  templateId: string | null;
  title: string;
  icon: string;
  cover: string | null;
  blocks: TemplateBlock[];
  dirty: boolean;
  setTemplateId: (id: string | null) => void;
  setMeta: (p: Partial<{ title: string; icon: string; cover: string | null }>) => void;
  setBlocks: (blocks: TemplateBlock[]) => void;
  loadFromServer: (payload: {
    id: string;
    title: string;
    icon: string;
    cover: string | null;
    blocks: TemplateBlock[];
  }) => void;
  applyAiPayload: (payload: AITemplatePayload) => void;
  updateBlock: (id: string, patch: Partial<TemplateBlock>) => void;
  removeBlock: (id: string) => void;
  insertBlock: (index: number, block: TemplateBlock) => void;
  duplicateBlock: (id: string) => void;
  moveBlock: (from: number, to: number) => void;
  markClean: () => void;
  markDirty: () => void;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  templateId: null,
  title: "Untitled",
  icon: "📄",
  cover: null,
  blocks: [],
  dirty: false,

  setTemplateId: (templateId) => set({ templateId }),

  setMeta: (p) => {
    set({ ...p, dirty: true });
  },

  setBlocks: (blocks) => set({ blocks, dirty: true }),

  loadFromServer: ({ id, title, icon, cover, blocks }) => {
    const normalizedBlocks = (Array.isArray(blocks) ? blocks : [])
      .map((raw) => {
        const source = raw as Record<string, unknown>;
        const normalized = normalizeAiBlock(source, typeof source.id === "string" ? source.id : undefined);
        return normalized;
      })
      .filter((b): b is TemplateBlock => b !== null);

    if (process.env.NODE_ENV !== "production") {
      const firstRaw = Array.isArray(blocks) ? (blocks[0] as Record<string, unknown> | undefined) : undefined;
      const firstNormalized = normalizedBlocks[0];
      // Debug compare: manual vs AI/persisted block shape.
      console.log("[editor] loadFromServer block-shape", {
        rawSample: firstRaw,
        normalizedSample: firstNormalized,
      });
    }

    set({
      templateId: id,
      title,
      icon,
      cover,
      blocks: normalizedBlocks,
      dirty: false,
    });
  },

  applyAiPayload: (payload) => {
    const n = normalizeAiTemplate(payload);
    set({
      title: n.title,
      icon: n.icon,
      cover: n.cover,
      blocks: n.blocks,
      dirty: true,
    });
  },

  updateBlock: (id, patch) => {
    const { blocks } = get();
    const next = blocks.map((b) => {
      if (b.id !== id) return b;
      if (b.type === "toggle" && "children" in patch && Array.isArray((patch as { children?: unknown }).children)) {
        return { ...b, ...patch } as TemplateBlock;
      }
      return { ...b, ...patch } as TemplateBlock;
    });
    set({ blocks: next, dirty: true });
  },

  removeBlock: (id) => {
    set({
      blocks: get().blocks.filter((b) => b.id !== id),
      dirty: true,
    });
  },

  insertBlock: (index, block) => {
    const blocks = [...get().blocks];
    blocks.splice(index, 0, block);
    set({ blocks, dirty: true });
  },

  duplicateBlock: (id) => {
    const blocks = [...get().blocks];
    const i = blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    const copy = structuredClone(blocks[i]) as TemplateBlock;
    blocks.splice(i + 1, 0, remapBlockIds(copy));
    set({ blocks, dirty: true });
  },

  moveBlock: (from, to) => {
    const blocks = [...get().blocks];
    const [item] = blocks.splice(from, 1);
    if (!item) return;
    blocks.splice(to, 0, item);
    set({ blocks, dirty: true });
  },

  markClean: () => set({ dirty: false }),
  markDirty: () => set({ dirty: true }),
}));
