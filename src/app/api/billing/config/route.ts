import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { STRIPE_PRICE_CONFIG } from "@/types/billing";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const secretConfigured = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const webhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
  const prices = STRIPE_PRICE_CONFIG.map((conf) => ({
    mode: conf.mode,
    pack: conf.pack,
    envKey: conf.envKey,
    configured: Boolean(process.env[conf.envKey]?.trim()),
  }));

  return NextResponse.json({
    stripe: {
      secretConfigured,
      webhookConfigured,
      prices,
    },
  });
}
