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

  const url = getCheckoutUrlForPlan(plan, user.email, user.id);
  if (!url) {
    return NextResponse.json(
      { error: "Lemon Squeezy 스토어 ID가 서버에 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url,
    plan,
    variantId,
    productId,
  });
}
