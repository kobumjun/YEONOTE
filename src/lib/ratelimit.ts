import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

function getRatelimit() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: false,
    });
  }
  return ratelimit;
}

export async function limitAiGeneration(userId: string): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const rl = getRatelimit();
  if (!rl) return { ok: true };
  const { success, reset } = await rl.limit(`ai:${userId}`);
  if (success) return { ok: true };
  const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
  return { ok: false, retryAfter };
}
