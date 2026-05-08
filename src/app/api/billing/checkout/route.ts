import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isAllowedLemonCheckoutVariantId } from "@/lib/lemon-billing";
import { createLemonCheckout } from "@/lib/lemonsqueezy";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  let body: { variantId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const variantId = typeof body.variantId === "string" ? body.variantId.trim() : "";
  if (!variantId) {
    return NextResponse.json({ error: "variantId is required." }, { status: 400 });
  }

  if (!isAllowedLemonCheckoutVariantId(variantId)) {
    return NextResponse.json(
      { error: "Unknown variant or Lemon variant env vars are not configured." },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const result = await createLemonCheckout({
    email: user.email,
    userId: user.id,
    variantId,
    redirectUrl: `${appUrl.replace(/\/$/, "")}/dashboard`,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    url: result.url,
    checkoutId: result.checkoutId,
  });
}
