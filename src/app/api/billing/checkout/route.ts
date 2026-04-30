import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getCheckoutUrlForPlan, getLemonProductId, getVariantIdForPlan } from "@/lib/lemonsqueezy";
import { LEMONSQUEEZY_VARIANT_ENV_BY_PLAN, type BillingPlan } from "@/types/billing";

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
        error: `Missing variant ID for plan "${plan}". Set ${LEMONSQUEEZY_VARIANT_ENV_BY_PLAN[plan]}.`,
      },
      { status: 500 }
    );
  }

  const productId = getLemonProductId();
  const url = getCheckoutUrlForPlan(plan, user.email, user.id);
  if (!url) {
    return NextResponse.json({ error: "LEMONSQUEEZY_STORE_ID is not set." }, { status: 500 });
  }

  return NextResponse.json({
    url,
    plan,
    variantId,
    /** Single catalog product id (optional in client; used for support/debug). */
    productId: productId ?? null,
  });
}
