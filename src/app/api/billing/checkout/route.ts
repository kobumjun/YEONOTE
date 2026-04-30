import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getCheckoutUrlForPlan, getLemonProductId, getVariantIdForPlan } from "@/lib/lemonsqueezy";
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

  const productId = getLemonProductId();
  if (!productId) {
    return NextResponse.json(
      {
        error: "Lemon Squeezy 제품 ID가 서버에 설정되지 않았습니다. 서버 환경 변수를 확인하세요.",
      },
      { status: 500 }
    );
  }

  const checkoutUrl = getCheckoutUrlForPlan(plan, user.email, user.id);
  if (!checkoutUrl) {
    return NextResponse.json(
      { error: "Lemon Squeezy 스토어 슬러그가 서버에 설정되지 않았습니다. LEMONSQUEEZY_STORE_SLUG를 확인하세요." },
      { status: 500 }
    );
  }

  console.log("Checkout URL:", checkoutUrl);
  console.log("Store slug:", process.env.LEMONSQUEEZY_STORE_SLUG);
  console.log("Store ID (API, not used in checkout host):", process.env.LEMONSQUEEZY_STORE_ID);
  console.log("Variant ID (plan):", variantId);
  console.log("Variant env PRO:", process.env.LEMONSQUEEZY_VARIANT_ID_PRO);

  return NextResponse.json({
    url: checkoutUrl,
    plan,
    variantId,
    productId,
  });
}
