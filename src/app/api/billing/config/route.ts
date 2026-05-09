import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { LEMON_CHECKOUT_VARIANT_DEFS } from "@/lib/lemon-billing";
import { getLemonStoreId } from "@/lib/lemonsqueezy";

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const apiConfigured = Boolean(process.env.LEMONSQUEEZY_API_KEY?.trim());
  const storeConfigured = Boolean(getLemonStoreId());
  const webhookConfigured = Boolean(process.env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim());

  const variants = LEMON_CHECKOUT_VARIANT_DEFS.map((def) => ({
    mode: def.mode,
    pack: def.pack,
    envKey: def.envKey,
    configured: Boolean(process.env[def.envKey]?.trim()),
  }));

  return NextResponse.json({
    lemonSqueezy: {
      apiConfigured,
      storeConfigured,
      webhookConfigured,
      variants,
    },
  });
}
