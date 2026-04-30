import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

/**
 * Lemon Squeezy customer portal URL is usually fetched via API with customer id.
 * Configure LEMONSQUEEZY_BILLING_PORTAL_URL after linking a customer, or build URL in your backend.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const portal = process.env.LEMONSQUEEZY_BILLING_PORTAL_URL;
  if (!portal) {
    return NextResponse.json({
      url: null,
      message: "Set LEMONSQUEEZY_BILLING_PORTAL_URL to your Lemon Squeezy customer portal link.",
    });
  }

  return NextResponse.json({ url: portal });
}
