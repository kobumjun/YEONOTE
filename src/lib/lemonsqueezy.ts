import { LEMONSQUEEZY_VARIANT_ENV_BY_PLAN, type BillingPlan } from "@/types/billing";

const LEMON_API_BASE = "https://api.lemonsqueezy.com/v1";

/** Single Lemon Squeezy product (variants distinguish Free / Pro / Team). */
export function getLemonProductId(): string | undefined {
  const id = process.env.LEMONSQUEEZY_PRODUCT_ID?.trim();
  return id || undefined;
}

export function getLemonStoreId(): string | undefined {
  const id = process.env.LEMONSQUEEZY_STORE_ID?.trim();
  return id || undefined;
}

export function getVariantIdForPlan(plan: BillingPlan): string | null {
  const key = LEMONSQUEEZY_VARIANT_ENV_BY_PLAN[plan];
  const id = process.env[key]?.trim();
  return id || null;
}

/** Resolve billing plan from Lemon variant id (same product, different variants). */
export function planFromVariantId(variantId: string | undefined | null): BillingPlan | null {
  if (variantId == null || variantId === "") return null;
  const v = String(variantId);
  for (const plan of ["free", "pro", "team"] as const) {
    const configured = getVariantIdForPlan(plan);
    if (configured && configured === v) return plan;
  }
  return null;
}

/** When webhook includes product id, ensure it matches our single product (if configured). */
export function isWebhookProductAllowed(productId: string | undefined | null): boolean {
  const ours = getLemonProductId();
  if (!ours) return true;
  if (productId == null || productId === "") return true;
  return String(productId) === ours;
}

/**
 * Store subdomain slug (dashboard URL). Optional; not used for API checkout creation.
 */
export function getLemonStoreSlug(): string | undefined {
  const slug = process.env.LEMONSQUEEZY_STORE_SLUG?.trim();
  return slug || undefined;
}

type LemonError = { errors?: { detail?: string; title?: string; meta?: unknown }[] };

/**
 * Creates a hosted checkout via Lemon Squeezy API.
 * @see https://docs.lemonsqueezy.com/api/checkouts/create-checkout
 * Returns `data.attributes.url` (e.g. …/checkout/custom/{uuid}?…).
 */
export async function createLemonCheckout(params: {
  email: string;
  userId: string;
  variantId: string;
}): Promise<{ ok: true; url: string; checkoutId: string } | { ok: false; error: string; status: number }> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim();
  const storeId = getLemonStoreId();
  if (!apiKey) {
    return { ok: false, error: "LEMONSQUEEZY_API_KEY가 서버에 설정되지 않았습니다.", status: 500 };
  }
  if (!storeId) {
    return { ok: false, error: "LEMONSQUEEZY_STORE_ID가 서버에 설정되지 않았습니다.", status: 500 };
  }

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: params.email,
          custom: { user_id: params.userId },
        },
      },
      relationships: {
        store: { data: { type: "stores", id: String(storeId) } },
        variant: { data: { type: "variants", id: String(params.variantId) } },
      },
    },
  };

  const res = await fetch(`${LEMON_API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, error: "Lemon Squeezy API 응답을 파싱할 수 없습니다.", status: res.status || 502 };
  }

  if (!res.ok) {
    const err = json as LemonError;
    const detail =
      err.errors?.map((e) => e.detail ?? e.title).filter(Boolean).join("; ") || res.statusText || "Unknown error";
    return { ok: false, error: detail, status: res.status || 502 };
  }

  const data = (json as { data?: { id?: string; attributes?: { url?: string } } }).data;
  const url = data?.attributes?.url;
  const checkoutId = data?.id;
  if (!url || !checkoutId) {
    return { ok: false, error: "체크아웃 응답에 url 또는 id가 없습니다.", status: 502 };
  }

  return { ok: true, url, checkoutId };
}

export async function createLemonCheckoutForPlan(
  plan: BillingPlan,
  email: string,
  userId: string
): Promise<
  { ok: true; url: string; checkoutId: string; variantId: string } | { ok: false; error: string; status: number }
> {
  const variantId = getVariantIdForPlan(plan);
  if (!variantId) {
    return { ok: false, error: `플랜 "${plan}"에 대한 변형 ID가 서버에 없습니다.`, status: 500 };
  }
  const result = await createLemonCheckout({ email, userId, variantId });
  if (!result.ok) return result;
  return { ok: true, url: result.url, checkoutId: result.checkoutId, variantId };
}
