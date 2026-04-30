export type BillingPlan = "free" | "pro" | "team";

/** One Lemon Squeezy product; plans map to variants via env (see `LEMONSQUEEZY_PRODUCT_ID`). */
export const LEMONSQUEEZY_PRODUCT_ENV_KEY = "LEMONSQUEEZY_PRODUCT_ID" as const;

/** Checkout host: `https://{slug}.lemonsqueezy.com/buy/...` — not the numeric store id. */
export const LEMONSQUEEZY_STORE_SLUG_ENV_KEY = "LEMONSQUEEZY_STORE_SLUG" as const;

export const LEMONSQUEEZY_VARIANT_ENV_BY_PLAN: Record<BillingPlan, string> = {
  free: "LEMONSQUEEZY_VARIANT_ID_FREE",
  pro: "LEMONSQUEEZY_VARIANT_ID_PRO",
  team: "LEMONSQUEEZY_VARIANT_ID_TEAM",
};

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
