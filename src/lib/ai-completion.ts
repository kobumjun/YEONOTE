import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export const AI_GENERATION_MAX_TOKENS = 6000;
export const AI_GENERATION_TIMEOUT_MS = 45_000;

export type StreamJsonResult = {
  raw: string;
  timedOut: boolean;
  usageTokens: number | null;
};

/**
 * Streams a chat completion as JSON text, with a hard wall-clock timeout.
 * On timeout, returns partial `raw` (if any) and `timedOut: true`.
 */
export async function streamChatCompletionJson(
  openai: OpenAI,
  params: {
    model: string;
    messages: ChatCompletionMessageParam[];
    temperature: number;
    response_format: { type: "json_object" };
  }
): Promise<StreamJsonResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_GENERATION_TIMEOUT_MS);
  let raw = "";
  let usageTokens: number | null = null;
  try {
    const stream = await openai.chat.completions.create(
      {
        model: params.model,
        messages: params.messages,
        temperature: params.temperature,
        response_format: params.response_format,
        max_tokens: AI_GENERATION_MAX_TOKENS,
        stream: true,
      },
      { signal: controller.signal }
    );

    for await (const chunk of stream) {
      const piece = chunk.choices[0]?.delta?.content;
      if (piece) raw += piece;
      const u = (chunk as { usage?: { total_tokens?: number } }).usage?.total_tokens;
      if (typeof u === "number") usageTokens = u;
    }
    clearTimeout(timer);
    return { raw, timedOut: false, usageTokens };
  } catch (e: unknown) {
    clearTimeout(timer);
    const aborted =
      controller.signal.aborted ||
      (e instanceof Error && (e.name === "AbortError" || /aborted|AbortError/i.test(e.message)));
    if (aborted) {
      return { raw, timedOut: true, usageTokens: null };
    }
    throw e;
  }
}
