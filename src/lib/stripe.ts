import Stripe from "stripe";
import { STRIPE_PRICE_CONFIG, type CreditPack, type PricingMode } from "@/types/billing";

export function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
}

export function resolvePriceId(mode: PricingMode, pack: CreditPack): string | null {
  const found = STRIPE_PRICE_CONFIG.find((c) => c.mode === mode && c.pack === pack);
  if (!found) return null;
  const id = process.env[found.envKey]?.trim();
  return id || null;
}

export function resolveCreditsByPriceId(priceId: string): { mode: PricingMode; pack: CreditPack; credits: number } | null {
  for (const conf of STRIPE_PRICE_CONFIG) {
    const envPriceId = process.env[conf.envKey]?.trim();
    if (envPriceId && envPriceId === priceId) {
      return { mode: conf.mode, pack: conf.pack, credits: conf.credits };
    }
  }
  return null;
}
