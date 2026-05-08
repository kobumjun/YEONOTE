export type BillingPlan = "free" | "starter" | "growth" | "bulk";

export type PricingMode = "one_time" | "subscription";
export type CreditPack = "starter" | "growth" | "bulk";

export type PriceConfig = {
  mode: PricingMode;
  pack: CreditPack;
  envKey: string;
  credits: number;
};

export const STRIPE_PRICE_CONFIG: PriceConfig[] = [
  { mode: "one_time", pack: "starter", envKey: "NEXT_PUBLIC_STRIPE_PRICE_STARTER", credits: 30 },
  { mode: "one_time", pack: "growth", envKey: "NEXT_PUBLIC_STRIPE_PRICE_GROWTH", credits: 100 },
  { mode: "one_time", pack: "bulk", envKey: "NEXT_PUBLIC_STRIPE_PRICE_BULK", credits: 250 },
  { mode: "subscription", pack: "starter", envKey: "NEXT_PUBLIC_STRIPE_PRICE_SUB_STARTER", credits: 50 },
  { mode: "subscription", pack: "growth", envKey: "NEXT_PUBLIC_STRIPE_PRICE_SUB_GROWTH", credits: 150 },
  { mode: "subscription", pack: "bulk", envKey: "NEXT_PUBLIC_STRIPE_PRICE_SUB_BULK", credits: 400 },
];

export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "paused"
  | "past_due"
  | "expired";

export type SubscriptionRow = {
  id: string;
  user_id: string;
  lemon_squeezy_id: string | null;
  plan: BillingPlan;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  created_at: string;
  updated_at: string;
};
