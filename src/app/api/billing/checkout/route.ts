import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getStripeClient, resolvePriceId } from "@/lib/stripe";
import type { CreditPack, PricingMode } from "@/types/billing";

const PACKS: CreditPack[] = ["starter", "growth", "bulk"];
const MODES: PricingMode[] = ["one_time", "subscription"];

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const packParam = (searchParams.get("pack") ?? "starter").toLowerCase();
  const modeParam = (searchParams.get("mode") ?? "one_time").toLowerCase();
  if (!PACKS.includes(packParam as CreditPack)) {
    return NextResponse.json({ error: "Invalid pack." }, { status: 400 });
  }
  if (!MODES.includes(modeParam as PricingMode)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }
  const pack = packParam as CreditPack;
  const mode = modeParam as PricingMode;

  const priceId = resolvePriceId(mode, pack);
  if (!priceId) {
    return NextResponse.json(
      {
        error: "Stripe price IDs are not configured. Check your .env values.",
      },
      { status: 500 }
    );
  }

  const stripe = getStripeClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: mode === "subscription" ? "subscription" : "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    metadata: {
      userId: user.id,
      mode,
      pack,
    },
    success_url: `${appUrl}/pricing?success=1`,
    cancel_url: `${appUrl}/pricing?canceled=1`,
    allow_promotion_codes: true,
    ...(mode === "subscription"
      ? {
          subscription_data: {
            metadata: {
              userId: user.id,
              pack,
            },
          },
        }
      : {}),
  });

  return NextResponse.json({
    url: session.url,
    mode,
    pack,
    priceId,
    checkoutId: session.id,
  });
}
