"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CREDIT_PACKS, type CreditPackKey, type PricingMode } from "@/lib/credits";
import { getLemonVariantIdForCheckout } from "@/lib/lemon-checkout-client";
import { createClient } from "@/lib/supabase/client";
import { withAuth } from "@/lib/auth-fetch";
import { CREDITS_PER_GENERATION } from "@/lib/ai-credits";
import { cn } from "@/lib/utils";

const PACK_ORDER: CreditPackKey[] = ["starter", "growth", "bulk"];

const FEATURE_LINES = [
  "Documents & letters",
  "Presentations & slides",
  "AI image generation",
  "Workspace templates",
] as const;

const DISPLAY_NAME: Record<CreditPackKey, string> = {
  starter: "Starter",
  growth: "Growth",
  bulk: "Bulk",
};

export function PricingClient() {
  const [billingMode, setBillingMode] = useState<PricingMode>("one_time");
  const [credits, setCredits] = useState(0);
  const [ceiling, setCeiling] = useState(5);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("ai_credits, ai_credits_ceiling")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (!data) return;
          setCredits(data.ai_credits ?? 0);
          setCeiling(Math.max(data.ai_credits_ceiling ?? 0, 5));
        });
    });
  }, []);

  const packs = useMemo(() => CREDIT_PACKS[billingMode], [billingMode]);
  const percent = ceiling > 0 ? Math.max(0, Math.min(100, (credits / ceiling) * 100)) : 0;

  async function handleBuy(pack: CreditPackKey) {
    const key = `${billingMode}:${pack}`;
    setBusyKey(key);
    try {
      const variantId = getLemonVariantIdForCheckout(billingMode, pack);
      if (!variantId) {
        toast.error("Checkout is not configured for this plan. Set Lemon variant env vars.");
        return;
      }
      const res = await fetch(
        "/api/billing/checkout",
        await withAuth({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId }),
        })
      );
      const j = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        toast.error(j.error ?? "Failed to open checkout page");
        return;
      }
      if (j.url) window.location.href = j.url;
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
      <div className="mb-10 text-center md:mb-12">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Simple, transparent <span className="yeo-gradient-text">pricing</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground md:text-base">Pay for what you create. No hidden fees.</p>
      </div>

      <div className="mb-10 flex justify-center">
        <div className="inline-flex rounded-xl border border-border/80 bg-muted/50 p-1 shadow-sm dark:bg-muted/30">
          <button
            type="button"
            onClick={() => setBillingMode("one_time")}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-medium transition-all",
              billingMode === "one_time"
                ? "bg-card text-foreground shadow-sm dark:bg-card/90"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            One-time
          </button>
          <button
            type="button"
            onClick={() => setBillingMode("subscription")}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-medium transition-all",
              billingMode === "subscription"
                ? "bg-card text-foreground shadow-sm dark:bg-card/90"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
            <span className="ml-1.5 text-xs font-normal text-emerald-600 dark:text-emerald-400">Save 20%</span>
          </button>
        </div>
      </div>

      <div className="mx-auto mb-10 max-w-sm rounded-2xl border border-border/70 bg-muted/30 p-4 dark:bg-muted/20">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-muted-foreground">Your credits</span>
          <span className="font-semibold tabular-nums text-foreground">
            {credits} / {ceiling}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {PACK_ORDER.map((pack) => {
          const cfg = packs[pack];
          const isPopular = "badge" in cfg && cfg.badge === "Most Popular";
          const badge = "badge" in cfg ? cfg.badge : null;
          const period = billingMode === "subscription" ? "/mo" : undefined;

          return (
            <div
              key={pack}
              className={cn(
                "relative flex flex-col rounded-2xl border-2 bg-card/90 p-6 pt-7 shadow-sm backdrop-blur-sm transition-all dark:bg-card/80",
                isPopular
                  ? "z-[1] border-violet-500 shadow-lg shadow-violet-500/10 md:scale-[1.02] dark:shadow-violet-500/20"
                  : "border-border/80 hover:border-border hover:shadow-md"
              )}
            >
              {badge ? (
                <div
                  className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-medium",
                    isPopular
                      ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-sm"
                      : "bg-foreground text-background"
                  )}
                >
                  {badge}
                </div>
              ) : null}

              <p className="mb-1 text-sm font-medium capitalize text-muted-foreground">{DISPLAY_NAME[pack]}</p>

              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-foreground">${cfg.usd}</span>
                {period ? <span className="text-sm text-muted-foreground">{period}</span> : null}
              </div>

              <p className="mb-6 text-sm text-muted-foreground">
                {cfg.credits} credits
                {billingMode === "one_time" ? " · never expires" : " · per month"}
              </p>

              <ul className="mb-6 flex flex-1 flex-col gap-2.5">
                {FEATURE_LINES.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full",
                        isPopular ? "bg-violet-500/15 dark:bg-violet-500/25" : "bg-muted"
                      )}
                    >
                      <Check className={cn("size-2.5 stroke-[3]", isPopular ? "text-violet-600 dark:text-violet-300" : "text-muted-foreground")} />
                    </span>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                disabled={busyKey !== null}
                onClick={() => void handleBuy(pack)}
                className={cn(
                  "mt-auto w-full rounded-xl py-2.5 text-sm font-medium transition-all",
                  isPopular
                    ? "yeo-gradient-btn text-white shadow-sm hover:shadow-lg"
                    : "bg-foreground text-background hover:bg-foreground/90 dark:bg-foreground dark:text-background"
                )}
              >
                {busyKey === `${billingMode}:${pack}` ? "Connecting…" : "Get started"}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        All plans include full access to every feature. Each generation uses {CREDITS_PER_GENERATION} credits regardless of type.
      </p>
    </div>
  );
}
