import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanFromVariant } from "@/lib/lemon-billing";
import { isWebhookProductAllowed } from "@/lib/lemonsqueezy";
import type { UserPlan } from "@/lib/subscription";

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

function subscriptionStatus(attrs: Record<string, unknown>): string {
  const s = String(attrs.status ?? "").toLowerCase();
  if (s === "active") return "active";
  if (s === "paused") return "paused";
  if (s === "past_due") return "past_due";
  if (s === "expired" || s === "unpaid") return "expired";
  return "cancelled";
}

function inferPlan(variantId: string | undefined, attrs: Record<string, unknown>): UserPlan {
  const fromVariant = resolvePlanFromVariant(variantId);
  if (fromVariant) return fromVariant;
  const name = String(attrs.variant_name ?? attrs.product_name ?? "").toLowerCase();
  if (name.includes("pro")) return "pro";
  if (name.includes("plus")) return "plus";
  return "plus";
}

async function updateProfilePlan(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  plan: UserPlan,
  subscriptionId: string,
  status: string,
  endsAt: string | null
) {
  await admin
    .from("profiles")
    .update({
      plan,
      subscription_id: subscriptionId,
      subscription_status: status,
      subscription_ends_at: endsAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
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

  if (!event.includes("subscription")) {
    return NextResponse.json({ received: true, ignored: "non_subscription_event" });
  }

  const productId = extractProductId(payload);
  if (!isWebhookProductAllowed(productId)) {
    return NextResponse.json({ received: true, ignored: "unknown_product" });
  }

  const variantId = extractVariantId(payload);
  const attrs = payload.data?.attributes ?? {};
  const plan = inferPlan(variantId, attrs);
  const userId = extractUserId(payload);
  const status = subscriptionStatus(attrs);
  const subscriptionId = String(payload.data?.id ?? "");
  const endsAt = (attrs.ends_at as string | undefined) ?? (attrs.current_period_ends_at as string | undefined) ?? null;

  if (!userId) {
    return NextResponse.json({ received: true, warning: "missing_user_id" });
  }

  if (event === "subscription_created" || event === "subscription_updated") {
    await updateProfilePlan(admin, userId, plan, subscriptionId, status === "active" ? "active" : status, endsAt);

    await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        lemon_squeezy_id: subscriptionId,
        plan,
        status,
        current_period_start: (attrs.current_period_starts_at as string | undefined) ?? null,
        current_period_end: (attrs.current_period_ends_at as string | undefined) ?? null,
        cancel_at: endsAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "lemon_squeezy_id" }
    );

    return NextResponse.json({ received: true, plan, status });
  }

  if (event === "subscription_cancelled") {
    await updateProfilePlan(admin, userId, plan, subscriptionId, "cancelled", endsAt);
    return NextResponse.json({ received: true, cancelled: true });
  }

  if (event === "subscription_expired") {
    await updateProfilePlan(admin, userId, "free", subscriptionId, "expired", endsAt);
    return NextResponse.json({ received: true, expired: true });
  }

  return NextResponse.json({ received: true });
}
