import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createLemonCheckoutForPack, getLemonProductId, getVariantIdForPack } from "@/lib/lemonsqueezy";
import type { CreditPack } from "@/types/billing";

const PACKS: CreditPack[] = ["pro", "team"];

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const planParam = (searchParams.get("plan") ?? "pro").toLowerCase();
  if (!PACKS.includes(planParam as CreditPack)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  const pack = planParam as CreditPack;

  const variantId = getVariantIdForPack(pack);
  if (!variantId) {
    return NextResponse.json(
      {
        error: "Lemon Squeezy variant ID is not configured for this credit pack. Check the variant IDs in .env.",
      },
      { status: 500 }
    );
  }

  const created = await createLemonCheckoutForPack(pack, user.email, user.id);
  if (!created.ok) {
    return NextResponse.json({ error: created.error }, { status: created.status });
  }

  const productId = getLemonProductId() ?? null;

  return NextResponse.json({
    url: created.url,
    plan: pack,
    variantId: created.variantId,
    checkoutId: created.checkoutId,
    productId,
  });
}
