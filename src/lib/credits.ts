/**
 * Tutorial credits shown in marketing copy. Must match DB:
 * `handle_new_user()` in `supabase/migrations/003_tutorial_credits_defaults.sql`
 * and `006_pricing_rework.sql` (INSERT … ai_credits, ai_credits_ceiling), and
 * `009_ensure_signup_credits_five.sql` and `010_signup_credits_six.sql`
 * (`ALTER COLUMN … SET DEFAULT`) — not set in `src/app/auth/callback` (profile
 * row is created by the DB trigger only).
 */
export const TUTORIAL_SIGNUP_CREDITS = 6;

export type PricingMode = "one_time" | "subscription";
export type CreditPackKey = "starter" | "growth" | "bulk";

export const CREDIT_PACKS = {
  one_time: {
    starter: { usd: 5, credits: 45 },
    growth: { usd: 15, credits: 150, badge: "Most Popular" },
    bulk: { usd: 29, credits: 400, badge: "Best Value" },
  },
  subscription: {
    starter: { usd: 9, credits: 75 },
    growth: { usd: 19, credits: 250, badge: "Most Popular" },
    bulk: { usd: 35, credits: 600, badge: "Best Value" },
  },
} as const;

export function creditsDisplay(remaining: number, ceiling: number): string {
  if (ceiling > 0) return `${remaining}/${ceiling}`;
  return `${remaining}`;
}

export function grantAmountForPack(mode: PricingMode, pack: CreditPackKey): number {
  return CREDIT_PACKS[mode][pack].credits;
}
