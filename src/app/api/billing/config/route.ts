import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLemonProductId, getVariantIdForPlan } from "@/lib/lemonsqueezy";
import type { BillingPlan } from "@/types/billing";

/**
 * Lemon Squeezy setup snapshot for the billing UI.
 * Reads secrets only on the server; never expose API keys or webhook secret.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productId = getLemonProductId() ?? null;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID?.trim() || null;
  const storeSlug = process.env.LEMONSQUEEZY_STORE_SLUG?.trim() || null;
  const apiKeyConfigured = Boolean(process.env.LEMONSQUEEZY_API_KEY?.trim());

  const variants: Record<BillingPlan, { configured: boolean }> = {
    free: { configured: Boolean(getVariantIdForPlan("free")) },
    pro: { configured: Boolean(getVariantIdForPlan("pro")) },
    team: { configured: Boolean(getVariantIdForPlan("team")) },
  };

  return NextResponse.json({
    lemon: {
      productId,
      storeIdConfigured: Boolean(storeId),
      storeSlugConfigured: Boolean(storeSlug),
      storeSlug: storeSlug ?? null,
      apiKeyConfigured,
      variants,
    },
  });
}
