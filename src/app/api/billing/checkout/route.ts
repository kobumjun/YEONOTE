import { createCheckout, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isAllowedLemonCheckoutVariantId } from "@/lib/lemon-billing";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim();
  const storeId = process.env.LEMONSQUEEZY_STORE_ID?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "LEMONSQUEEZY_API_KEY is not configured." }, { status: 500 });
  }
  if (!storeId) {
    return NextResponse.json({ error: "LEMONSQUEEZY_STORE_ID is not configured." }, { status: 500 });
  }

  let body: { variantId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const variantId = typeof body.variantId === "string" ? body.variantId.trim() : "";
  if (!variantId) {
    return NextResponse.json({ error: "Missing variantId" }, { status: 400 });
  }

  if (!isAllowedLemonCheckoutVariantId(variantId)) {
    return NextResponse.json(
      { error: "Unknown variant or Lemon variant env vars are not configured." },
      { status: 400 }
    );
  }

  lemonSqueezySetup({ apiKey });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUrl = `${appUrl.replace(/\/$/, "")}/dashboard`;

  const checkout = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: user.email,
      custom: { user_id: user.id },
    },
    productOptions: {
      redirectUrl,
    },
  });

  if (checkout.error) {
    return NextResponse.json(
      { error: checkout.error.message },
      { status: checkout.statusCode && checkout.statusCode >= 400 ? checkout.statusCode : 502 }
    );
  }

  const resource = checkout.data?.data;
  const url = resource?.attributes?.url;
  if (!url || !resource?.id) {
    return NextResponse.json({ error: "Checkout response missing url or id." }, { status: 502 });
  }

  return NextResponse.json({ url, checkoutId: resource.id });
}
