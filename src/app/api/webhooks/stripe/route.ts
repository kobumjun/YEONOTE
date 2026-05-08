import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient, resolveCreditsByPriceId } from "@/lib/stripe";
import { grantAmountForPack } from "@/lib/credits";
import type { CreditPack, PricingMode } from "@/types/billing";

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ received: true, warning: "Webhook not configured." });

  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  const stripe = getStripeClient();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const admin = createAdminClient();
  const eventKey = event.id;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};
    const userId = str(meta.userId);
    const mode = str(meta.mode) as PricingMode;
    const pack = str(meta.pack) as CreditPack;
    if (!userId || mode !== "one_time" || !["starter", "growth", "bulk"].includes(pack)) {
      return NextResponse.json({ received: true, ignored: true });
    }
    const credits = grantAmountForPack("one_time", pack);

    const { error: dupeErr } = await admin.from("processed_stripe_events").insert({ event_id: eventKey, user_id: userId });
    if (dupeErr?.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    if (dupeErr) return NextResponse.json({ received: true, warning: "event_insert_failed" });

    const { data: profile } = await admin.from("profiles").select("ai_credits, ai_credits_ceiling").eq("id", userId).single();
    const nextCredits = (profile?.ai_credits ?? 0) + credits;
    const nextCeiling = Math.max(profile?.ai_credits_ceiling ?? 0, nextCredits);
    await admin
      .from("profiles")
      .update({ ai_credits: nextCredits, ai_credits_ceiling: nextCeiling, plan: pack, updated_at: new Date().toISOString() })
      .eq("id", userId);
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const firstLine = invoice.lines.data[0] as
      | { price?: { id?: string | null } | null; pricing?: { price_details?: { price?: string | null } | null } | null }
      | undefined;
    const priceId = str(firstLine?.price?.id ?? firstLine?.pricing?.price_details?.price);
    const cfg = resolveCreditsByPriceId(priceId);
    if (!cfg || cfg.mode !== "subscription") return NextResponse.json({ received: true, ignored: true });

    const subscriptionField = (invoice as unknown as { subscription?: string | { id?: string } | null }).subscription;
    const subscriptionId = typeof subscriptionField === "string" ? subscriptionField : subscriptionField?.id;
    if (!subscriptionId) return NextResponse.json({ received: true, warning: "missing_subscription" });
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = str(subscription.metadata?.userId);
    if (!userId) return NextResponse.json({ received: true, warning: "missing_user_id" });

    const { error: dupeErr } = await admin.from("processed_stripe_events").insert({ event_id: eventKey, user_id: userId });
    if (dupeErr?.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    if (dupeErr) return NextResponse.json({ received: true, warning: "event_insert_failed" });

    await admin
      .from("profiles")
      .update({
        ai_credits: cfg.credits,
        ai_credits_ceiling: cfg.credits,
        plan: cfg.pack,
        ai_generations_reset_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  return NextResponse.json({ received: true });
}
