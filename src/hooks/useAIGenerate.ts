"use client";

import { useCallback, useState } from "react";
import type { AIGeneratePayload } from "@/types/template";
import { CREDITS_PER_GENERATION } from "@/lib/ai-credits";
import { withAuth } from "@/lib/auth-fetch";

type ProgressCb = (message: string) => void;

export type AIGenerateResult = {
  payload: AIGeneratePayload;
  creditsRemaining: number | null;
  usedCredit: boolean;
  chargedCredits: number;
  warning?: string;
};

export function useAIGenerate() {
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStream = useCallback(
    async (
      prompt: string,
      opts: { onProgress?: ProgressCb; onBlock?: (raw: unknown) => void }
    ): Promise<AIGenerateResult | null> => {
      setStreaming(true);
      setError(null);
      const rawBlocks: unknown[] = [];
      let meta: {
        title?: string;
        icon?: string;
        cover?: string;
        creditsRemaining?: number;
        usedCredit?: boolean;
        chargedCredits?: number;
        warning?: string;
        payload?: AIGeneratePayload;
      } = {};

      try {
        const res = await fetch(
          "/api/ai/generate",
          await withAuth({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
          })
        );

        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
          const err = new Error(j.error ?? res.statusText) as Error & { code?: string };
          err.code = j.code;
          throw err;
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("Missing response body");

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
                creditsRemaining?: number;
                chargedCredits?: number;
                payload?: AIGeneratePayload;
              };
              if (data.type === "progress" && data.message) opts.onProgress?.(data.message);
              if (data.type === "block" && data.block !== undefined) {
                rawBlocks.push(data.block);
                opts.onBlock?.(data.block);
              }
              if (data.type === "done") {
                const done = data as unknown as {
                  creditsRemaining?: number;
                  usedCredit?: boolean;
                  chargedCredits?: number;
                  warning?: string;
                  payload?: AIGeneratePayload;
                };
                meta = {
                  creditsRemaining: typeof done.creditsRemaining === "number" ? done.creditsRemaining : undefined,
                  usedCredit: typeof done.usedCredit === "boolean" ? done.usedCredit : true,
                  chargedCredits: typeof done.chargedCredits === "number" ? done.chargedCredits : 1,
                  warning: done.warning,
                  payload: done.payload,
                };
              }
            } catch {
              /* ignore partial */
            }
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Generation failed";
        const code = e instanceof Error && "code" in e ? (e as Error & { code?: string }).code : undefined;
        setError(msg);
        setStreaming(false);
        const err = new Error(msg) as Error & { code?: string };
        err.code = code;
        throw err;
      }

      setStreaming(false);
      const payload: AIGeneratePayload = meta.payload ?? {
        creationType: "template",
        title: "Untitled",
        blocks: rawBlocks,
      };
      return {
        payload,
        creditsRemaining: meta.creditsRemaining ?? null,
        usedCredit: meta.usedCredit !== false,
        chargedCredits: meta.chargedCredits ?? CREDITS_PER_GENERATION,
        warning: meta.warning,
      };
    },
    []
  );

  return { generateStream, streaming, error };
}
