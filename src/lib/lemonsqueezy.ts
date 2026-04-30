import { LEMONSQUEEZY_VARIANT_ENV_BY_PLAN, type BillingPlan } from "@/types/billing";

/** Single Lemon Squeezy product (variants distinguish Free / Pro / Team). */
export function getLemonProductId(): string | undefined {
  const id = process.env.LEMONSQUEEZY_PRODUCT_ID?.trim();
  return id || undefined;
}

export function getVariantIdForPlan(plan: BillingPlan): string | null {
  const key = LEMONSQUEEZY_VARIANT_ENV_BY_PLAN[plan];
  const id = process.env[key]?.trim();
  return id || null;
}

/** Resolve billing plan from Lemon variant id (same product, different variants). */
export function planFromVariantId(variantId: string | undefined | null): BillingPlan | null {
  if (variantId == null || variantId === "") return null;
  const v = String(variantId);
  for (const plan of ["free", "pro", "team"] as const) {
    const configured = getVariantIdForPlan(plan);
    if (configured && configured === v) return plan;
  }
  return null;
}

/** When webhook includes product id, ensure it matches our single product (if configured). */
export function isWebhookProductAllowed(productId: string | undefined | null): boolean {
  const ours = getLemonProductId();
  if (!ours) return true;
  if (productId == null || productId === "") return true;
  return String(productId) === ours;
}

/**
 * Lemon Squeezy checkout URL for a variant (one product, many variants).
 */
export function getCheckoutUrl(variantId: string, email: string, userId: string) {
  const store = process.env.LEMONSQUEEZY_STORE_ID;
  if (!store) return null;
  const params = new URLSearchParams({
    checkout: "custom",
    "checkout[email]": email,
    "checkout[custom][user_id]": userId,
  });
  return `https://${store}.lemonsqueezy.com/checkout/buy/${variantId}?${params.toString()}`;
}

export function getCheckoutUrlForPlan(plan: BillingPlan, email: string, userId: string): string | null {
  const variantId = getVariantIdForPlan(plan);
  if (!variantId) return null;
  return getCheckoutUrl(variantId, email, userId);
}
