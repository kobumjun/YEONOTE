import type { UserPlan } from "@/lib/subscription";

export type BillingInterval = "monthly" | "yearly";

export const LEMON_SUBSCRIPTION_VARIANTS: {
  plan: UserPlan;
  interval: BillingInterval;
  envKey: string;
}[] = [
  { plan: "plus", interval: "monthly", envKey: "LEMONSQUEEZY_PLUS_MONTHLY_VARIANT_ID" },
  { plan: "plus", interval: "yearly", envKey: "LEMONSQUEEZY_PLUS_YEARLY_VARIANT_ID" },
  { plan: "pro", interval: "monthly", envKey: "LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID" },
  { plan: "pro", interval: "yearly", envKey: "LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID" },
];

export function resolvePlanFromVariant(variantId: string | undefined | null): UserPlan | null {
  if (!variantId) return null;
  const v = String(variantId);
  for (const def of LEMON_SUBSCRIPTION_VARIANTS) {
    const id = process.env[def.envKey]?.trim();
    if (id && id === v) return def.plan;
  }
  const name = v.toLowerCase();
  if (name.includes("pro")) return "pro";
  if (name.includes("plus")) return "plus";
  return null;
}

export function variantIdForPlan(plan: UserPlan, interval: BillingInterval): string | null {
  const def = LEMON_SUBSCRIPTION_VARIANTS.find((d) => d.plan === plan && d.interval === interval);
  if (!def) return null;
  return process.env[def.envKey]?.trim() ?? null;
}

export function isAllowedLemonCheckoutVariantId(variantId: string): boolean {
  return resolvePlanFromVariant(variantId) != null;
}
