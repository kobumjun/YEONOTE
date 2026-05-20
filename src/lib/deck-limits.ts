import { createClient } from "@/lib/supabase/server";
import { DECK_LIMITS, DAILY_AI_LIMITS, SLIDE_LIMITS, type UserPlan } from "@/lib/subscription";

export async function getActiveDeckCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("templates")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("creation_type", "presentation")
    .eq("is_deleted", false);
  if (error) throw error;
  return count ?? 0;
}

export async function getTodayAIUsage(userId: string): Promise<number> {
  const supabase = await createClient();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start.toISOString());
  if (error) throw error;
  return count ?? 0;
}

export function checkDeckLimit(plan: UserPlan, deckCount: number): { ok: boolean; message?: string } {
  const limit = DECK_LIMITS[plan];
  if (deckCount >= limit) {
    return {
      ok: false,
      message: `Free plan allows up to ${limit} active decks. Upgrade to Plus for unlimited decks.`,
    };
  }
  return { ok: true };
}

export function checkSlideLimit(plan: UserPlan, slideCount: number): { ok: boolean; message?: string } {
  const limit = SLIDE_LIMITS[plan];
  if (slideCount >= limit) {
    return {
      ok: false,
      message: `${plan === "free" ? "Free" : plan === "plus" ? "Plus" : "Pro"} plan allows up to ${limit} slides per deck.`,
    };
  }
  return { ok: true };
}

export function checkDailyAI(plan: UserPlan, usage: number): { ok: boolean; message?: string } {
  const limit = DAILY_AI_LIMITS[plan];
  if (usage >= limit) {
    return {
      ok: false,
      message: "Free plan allows 8 AI requests per day. Resets at midnight.",
    };
  }
  return { ok: true };
}
