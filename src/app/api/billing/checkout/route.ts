import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createLemonCheckoutForPlan, getLemonProductId, getVariantIdForPlan } from "@/lib/lemonsqueezy";
import type { BillingPlan } from "@/types/billing";

const PLANS: BillingPlan[] = ["free", "pro", "team"];

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const planParam = (searchParams.get("plan") ?? "pro").toLowerCase();
  if (!PLANS.includes(planParam as BillingPlan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  const plan = planParam as BillingPlan;

  const variantId = getVariantIdForPlan(plan);
  if (!variantId) {
    return NextResponse.json(
      {
        error: "이 플랜에 대한 Lemon Squeezy 변형 ID가 서버에 설정되지 않았습니다. .env의 변형 ID를 확인하세요.",
      },
      { status: 500 }
    );
  }

  const created = await createLemonCheckoutForPlan(plan, user.email, user.id);
  if (!created.ok) {
    return NextResponse.json({ error: created.error }, { status: created.status });
  }

  console.log("Checkout URL (from Lemon API):", created.url);
  console.log("Checkout ID:", created.checkoutId);
  console.log("Store ID:", process.env.LEMONSQUEEZY_STORE_ID);
  console.log("Variant ID (plan):", created.variantId);

  const productId = getLemonProductId() ?? null;

  return NextResponse.json({
    url: created.url,
    plan,
    variantId: created.variantId,
    checkoutId: created.checkoutId,
    productId,
  });
}
