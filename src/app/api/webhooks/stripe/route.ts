import { NextResponse } from "next/server";

/** Stripe is not used; billing is Lemon Squeezy only. */
export async function POST() {
  return NextResponse.json(
    { error: "Stripe webhooks are disabled. Use /api/webhooks/lemonsqueezy." },
    { status: 410 }
  );
}
