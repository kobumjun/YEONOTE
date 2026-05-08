import type { CreditPackKey, PricingMode } from "@/lib/credits";

/** Static env reads so Next.js inlines `NEXT_PUBLIC_*` in the client bundle. */
export function getLemonVariantIdForCheckout(mode: PricingMode, pack: CreditPackKey): string | undefined {
  let raw: string | undefined;
  if (mode === "one_time") {
    if (pack === "starter") raw = process.env.NEXT_PUBLIC_LS_VARIANT_STARTER;
    else if (pack === "growth") raw = process.env.NEXT_PUBLIC_LS_VARIANT_GROWTH;
    else raw = process.env.NEXT_PUBLIC_LS_VARIANT_BULK;
  } else {
    if (pack === "starter") raw = process.env.NEXT_PUBLIC_LS_VARIANT_SUB_STARTER;
    else if (pack === "growth") raw = process.env.NEXT_PUBLIC_LS_VARIANT_SUB_GROWTH;
    else raw = process.env.NEXT_PUBLIC_LS_VARIANT_SUB_BULK;
  }
  const id = raw?.trim();
  return id || undefined;
}
