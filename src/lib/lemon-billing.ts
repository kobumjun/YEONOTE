import { CREDIT_PACKS, type CreditPackKey, type PricingMode } from "@/lib/credits";

/** Env keys for Lemon variant IDs (one per checkout tier). */
export const LEMON_CHECKOUT_VARIANT_DEFS: { mode: PricingMode; pack: CreditPackKey; envKey: string }[] = [
  { mode: "one_time", pack: "starter", envKey: "NEXT_PUBLIC_LS_VARIANT_STARTER" },
  { mode: "one_time", pack: "growth", envKey: "NEXT_PUBLIC_LS_VARIANT_GROWTH" },
  { mode: "one_time", pack: "bulk", envKey: "NEXT_PUBLIC_LS_VARIANT_BULK" },
  { mode: "subscription", pack: "starter", envKey: "NEXT_PUBLIC_LS_VARIANT_SUB_STARTER" },
  { mode: "subscription", pack: "growth", envKey: "NEXT_PUBLIC_LS_VARIANT_SUB_GROWTH" },
  { mode: "subscription", pack: "bulk", envKey: "NEXT_PUBLIC_LS_VARIANT_SUB_BULK" },
];

export type LemonVariantPurchase = {
  credits: number;
  pack: CreditPackKey;
  mode: PricingMode;
};

/**
 * Resolves a Lemon variant id to credits + tier + billing mode (one-time vs subscription).
 * Includes legacy Pro / Team variant envs for existing checkouts.
 */
export function resolveLemonVariantPurchase(
  variantId: string | undefined | null
): LemonVariantPurchase | null {
  if (variantId == null || variantId === "") return null;
  const v = String(variantId);
  for (const def of LEMON_CHECKOUT_VARIANT_DEFS) {
    const id = process.env[def.envKey]?.trim();
    if (id && id === v) {
      return {
        credits: CREDIT_PACKS[def.mode][def.pack].credits,
        pack: def.pack,
        mode: def.mode,
      };
    }
  }
  const pro = process.env.LEMONSQUEEZY_VARIANT_ID_PRO?.trim();
  const team = process.env.LEMONSQUEEZY_VARIANT_ID_TEAM?.trim();
  if (pro && v === pro) {
    return { credits: 100, pack: "growth", mode: "one_time" };
  }
  if (team && v === team) {
    return { credits: 300, pack: "bulk", mode: "one_time" };
  }
  return null;
}

export function creditsForLemonVariant(variantId: string | undefined | null): number {
  return resolveLemonVariantPurchase(variantId)?.credits ?? 0;
}

export function packForLemonVariant(variantId: string | undefined | null): CreditPackKey | null {
  return resolveLemonVariantPurchase(variantId)?.pack ?? null;
}

export function isAllowedLemonCheckoutVariantId(variantId: string): boolean {
  return resolveLemonVariantPurchase(variantId) != null;
}
