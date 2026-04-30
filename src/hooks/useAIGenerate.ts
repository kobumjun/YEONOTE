"use client";

import { useCallback, useState } from "react";
import type { AITemplatePayload } from "@/types/template";

type ProgressCb = (message: string) => void;

export function useAIGenerate() {
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStream = useCallback(
    async (
      prompt: string,
      opts: { tags?: string[]; style?: string; onProgress?: ProgressCb; onBlock?: (raw: unknown) => void }
    ): Promise<AITemplatePayload | null> => {
      setStreaming(true);
      setError(null);
      const rawBlocks: unknown[] = [];
      let meta: { title?: string; icon?: string; cover?: string } = {};

      try {
        const res = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, tags: opts.tags, style: opts.style }),
        });

        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as { error?: string }).error ?? res.statusText);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            const json = line.replace(/^data:\s*/, "");
            try {
              const data = JSON.parse(json) as {
                type: string;
                message?: string;
                block?: unknown;
                title?: string;
                icon?: string;
                cover?: string;
              };
              if (data.type === "progress" && data.message) opts.onProgress?.(data.message);
              if (data.type === "block" && data.block !== undefined) {
                rawBlocks.push(data.block);
                opts.onBlock?.(data.block);
              }
              if (data.type === "done") {
                meta = { title: data.title, icon: data.icon, cover: data.cover };
              }
            } catch {
              /* ignore partial */
            }
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Generation failed";
        setError(msg);
        setStreaming(false);
        return null;
      }

      setStreaming(false);
      const payload: AITemplatePayload = {
        title: meta.title ?? "Untitled",
        icon: meta.icon,
        cover: meta.cover,
        blocks: rawBlocks,
      };
      return payload;
    },
    []
  );

  return { generateStream, streaming, error };
}
