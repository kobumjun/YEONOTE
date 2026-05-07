import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createLemonCheckoutForPack, getLemonProductId, getVariantIdForPack } from "@/lib/lemonsqueezy";
import type { CreditPack } from "@/types/billing";

const PACKS: CreditPack[] = ["pro", "team"];

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const planParam = (searchParams.get("plan") ?? "pro").toLowerCase();
  if (!PACKS.includes(planParam as CreditPack)) {
    return NextResponse.json({ error: "플랜이 올바르지 않아요." }, { status: 400 });
  }
  const pack = planParam as CreditPack;

  const variantId = getVariantIdForPack(pack);
  if (!variantId) {
    return NextResponse.json(
      {
        error: "Lemon Squeezy 상품 variant ID가 설정되지 않았어요. .env의 variant ID를 확인해 주세요.",
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
