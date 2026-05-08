/** New users receive this many tutorial credits (Supabase trigger + column default). */
export const TUTORIAL_SIGNUP_CREDITS = 5;

export type PricingMode = "one_time" | "subscription";
export type CreditPackKey = "starter" | "growth" | "bulk";

export const CREDIT_PACKS = {
  one_time: {
    starter: { usd: 5, credits: 30 },
    growth: { usd: 15, credits: 100, badge: "Most Popular" },
    bulk: { usd: 29, credits: 250, badge: "Best Value" },
  },
  subscription: {
    starter: { usd: 9, credits: 50 },
    growth: { usd: 19, credits: 150, badge: "Most Popular" },
    bulk: { usd: 35, credits: 400, badge: "Best Value" },
  },
} as const;

export function creditsDisplay(remaining: number, ceiling: number): string {
  if (ceiling > 0) return `${remaining}/${ceiling}`;
  return `${remaining}`;
}

export function grantAmountForPack(mode: PricingMode, pack: CreditPackKey): number {
  return CREDIT_PACKS[mode][pack].credits;
}
