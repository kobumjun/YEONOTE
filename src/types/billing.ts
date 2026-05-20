import type { UserPlan } from "@/lib/subscription";

export type BillingPlan = UserPlan;

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
