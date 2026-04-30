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
        error: "이 크레딧 팩에 대한 Lemon Squeezy 변형 ID가 서버에 설정되지 않았습니다. .env의 변형 ID를 확인하세요.",
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
