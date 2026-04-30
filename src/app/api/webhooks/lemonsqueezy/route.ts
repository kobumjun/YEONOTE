import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isWebhookProductAllowed, planFromVariantId } from "@/lib/lemonsqueezy";
import type { BillingPlan, CreditPack } from "@/types/billing";

function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const hmac = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch {
    return false;
  }
}

type JsonApiRel = { data?: { id?: string; type?: string } | null };

function extractRelationshipId(
  payload: { data?: { relationships?: Record<string, JsonApiRel> } },
  name: string
): string | undefined {
  const rel = payload.data?.relationships?.[name]?.data;
  const id = rel && typeof rel === "object" && "id" in rel ? rel.id : undefined;
  return id != null ? String(id) : undefined;
}

function extractVariantId(payload: {
  data?: {
    relationships?: Record<string, JsonApiRel>;
    attributes?: Record<string, unknown>;
  };
}): string | undefined {
  const fromRel = extractRelationshipId(payload, "variant");
  if (fromRel) return fromRel;
  const attrs = payload.data?.attributes;
  if (attrs && "variant_id" in attrs && attrs.variant_id != null) {
    return String(attrs.variant_id);
  }
  return undefined;
}

function extractProductId(payload: {
  data?: { relationships?: Record<string, JsonApiRel> };
}): string | undefined {
  return extractRelationshipId(payload, "product");
}

function extractUserId(payload: {
  meta?: { custom_data?: Record<string, unknown> };
  data?: { attributes?: Record<string, unknown> };
}): string {
  const metaCd = payload.meta?.custom_data;
  if (metaCd && typeof metaCd.user_id === "string") return metaCd.user_id;
  const urls = payload.data?.attributes?.urls as Record<string, unknown> | undefined;
  if (urls && typeof urls.custom_data === "object" && urls.custom_data && "user_id" in urls.custom_data) {
    const uid = (urls.custom_data as Record<string, unknown>).user_id;
    if (typeof uid === "string") return uid;
  }
  const attrs = payload.data?.attributes ?? {};
  if (typeof attrs.user_id === "string") return attrs.user_id;
  return "";
}

function subscriptionStatus(attrs: Record<string, unknown>): "active" | "cancelled" | "paused" | "past_due" | "expired" {
  const s = String(attrs.status ?? "").toLowerCase();
  if (s === "active") return "active";
  if (s === "paused") return "paused";
  if (s === "past_due") return "past_due";
  if (s === "expired" || s === "unpaid") return "expired";
  return "cancelled";
}

function variantIdFromOrderAttributes(attrs: Record<string, unknown>): string | undefined {
  const foi = attrs.first_order_item as { variant_id?: string | number } | undefined;
  if (foi?.variant_id == null) return undefined;
  return String(foi.variant_id);
}

function creditsFromVariantId(variantId: string | undefined): number {
  const proVariantId = process.env.LEMONSQUEEZY_VARIANT_ID_PRO;
  const teamVariantId = process.env.LEMONSQUEEZY_VARIANT_ID_TEAM;
  if (!variantId) return 0;
  if (proVariantId && variantId === proVariantId) return 100;
  if (teamVariantId && variantId === teamVariantId) return 300;
  return 0;
}

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ received: true, warning: "Webhook not configured" });
  }

  const raw = await req.text();
  const sig =
    req.headers.get("x-signature") ??
    req.headers.get("X-Signature") ??
    req.headers.get("x-lemonsqueezy-signature");

  if (!verifySignature(raw, sig, secret)) {
    return NextResponse.json({ received: true, warning: "Invalid signature" });
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: Record<string, unknown> };
    data?: {
      id?: string | number;
      type?: string;
      attributes?: Record<string, unknown>;
      relationships?: Record<string, JsonApiRel>;
    };
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ received: true, warning: "Invalid JSON" });
  }

  const event = payload.meta?.event_name ?? "";
  const admin = createAdminClient();
  console.log("[lemonsqueezy webhook] event:", event);

  if (event === "order_created") {
    const attrs = payload.data?.attributes ?? {};
    const productId = extractProductId(payload);
    if (!isWebhookProductAllowed(productId)) {
      return NextResponse.json({ received: true, ignored: "unknown_product" });
    }

    const variantId = variantIdFromOrderAttributes(attrs);
    const userId = extractUserId(payload);
    const creditsToAdd = creditsFromVariantId(variantId);
    console.log("[lemonsqueezy webhook] order_created", {
      variant_id: variantId ?? null,
      user_id: userId || null,
      credits_added: creditsToAdd,
    });

    if (!creditsToAdd) {
      console.warn("[lemonsqueezy webhook] unknown variant id", { variant_id: variantId ?? null });
      return NextResponse.json({ received: true, ignored: "unknown_variant" });
    }

    if (!userId) {
      return NextResponse.json({ received: true, warning: "missing_user_id" });
    }

    const orderKey = String(payload.data?.id ?? attrs.identifier ?? "");
    if (!orderKey) {
      return NextResponse.json({ received: true, warning: "missing_order_id" });
    }

    const { error: insErr } = await admin.from("processed_lemon_orders").insert({
      lemon_order_id: orderKey,
      user_id: userId,
    });
    if (insErr?.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    if (insErr) {
      console.error("processed_lemon_orders insert", insErr);
      return NextResponse.json({ received: true, warning: "processed_order_insert_failed" });
    }

    const { data: row } = await admin.from("profiles").select("ai_credits, ai_credits_ceiling").eq("id", userId).single();
    const nextCredits = (row?.ai_credits ?? 0) + creditsToAdd;
    const nextCeiling = (row?.ai_credits_ceiling ?? 0) + creditsToAdd;

    let pack: CreditPack | null = planFromVariantId(variantId);
    if (!pack) {
      pack = creditsToAdd === 300 ? "team" : "pro";
    }

    const { error: upErr } = await admin
      .from("profiles")
      .update({
        plan: pack,
        ai_credits: nextCredits,
        ai_credits_ceiling: nextCeiling,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (upErr) {
      console.error("profiles credit grant", upErr);
      return NextResponse.json({ received: true, warning: "profile_credit_update_failed" });
    }

    return NextResponse.json({ received: true, order: orderKey, credits_added: creditsToAdd });
  }

  if (!event.includes("subscription")) {
    return NextResponse.json({ received: true });
  }

  const productId = extractProductId(payload);
  if (!isWebhookProductAllowed(productId)) {
    return NextResponse.json({ received: true, ignored: "unknown_product" });
  }

  const variantId = extractVariantId(payload);
  let plan: BillingPlan | null = planFromVariantId(variantId);

  if (!plan) {
    const attrs = payload.data?.attributes ?? {};
    const name = String(attrs.variant_name ?? attrs.product_name ?? "").toLowerCase();
    if (name.includes("team")) plan = "team";
    else if (name.includes("pro")) plan = "pro";
  }

  if (!plan) {
    plan = "pro";
  }

  const userId = extractUserId(payload);
  const attrs = payload.data?.attributes ?? {};
  const status = subscriptionStatus(attrs);

  if (!userId) {
    return NextResponse.json({ received: true, warning: "missing_user_id" });
  }

  const { error: subErr } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      lemon_squeezy_id: String(payload.data?.id ?? ""),
      plan,
      status,
      current_period_start: (attrs.current_period_starts_at as string | undefined) ?? null,
      current_period_end: (attrs.current_period_ends_at as string | undefined) ?? null,
      cancel_at: (attrs.ends_at as string | undefined) ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "lemon_squeezy_id" }
  );
  if (subErr) {
    console.error("subscription upsert failed", subErr);
  }

  const { error: planErr } = await admin.from("profiles").update({ plan }).eq("id", userId);
  if (planErr) {
    console.error("profile plan update failed", planErr);
  }

  return NextResponse.json({ received: true });
}
