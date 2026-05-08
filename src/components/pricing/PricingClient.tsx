"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CREDIT_PACKS, type CreditPackKey, type PricingMode } from "@/lib/credits";
import { getLemonVariantIdForCheckout } from "@/lib/lemon-checkout-client";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const PACK_ORDER: CreditPackKey[] = ["starter", "growth", "bulk"];

export function PricingClient() {
  const [mode, setMode] = useState<PricingMode>("one_time");
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

  const packs = useMemo(() => CREDIT_PACKS[mode], [mode]);
  const percent = ceiling > 0 ? Math.max(0, Math.min(100, (credits / ceiling) * 100)) : 0;

  async function buy(pack: CreditPackKey) {
    const key = `${mode}:${pack}`;
    setBusyKey(key);
    try {
      const variantId = getLemonVariantIdForCheckout(mode, pack);
      if (!variantId) {
        toast.error("Checkout is not configured for this plan. Set Lemon variant env vars.");
        return;
      }
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });
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
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <h1 className="font-heading text-3xl font-semibold tracking-[-0.02em]">Get More Credits</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Buy credits to generate documents, presentations, images, and templates with AI.
      </p>

      <Tabs value={mode} onValueChange={(v) => setMode(v as PricingMode)} className="mt-6">
        <TabsList className="rounded-xl border border-border bg-muted/40">
          <TabsTrigger value="one_time">One-time</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">CURRENT PLAN</p>
        <p className="mt-1 text-sm font-medium">{credits} / {ceiling} credits remaining</p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
          <div className="h-1.5 rounded-full bg-yeo-600 transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {PACK_ORDER.map((pack) => {
          const cfg = packs[pack];
          const highlight = pack === "growth";
          return (
            <div
              key={pack}
              className={cn(
                "rounded-xl border border-border bg-card p-5 shadow-sm",
                highlight && "border-yeo-500 ring-1 ring-yeo-500/30"
              )}
            >
              <div className="flex items-start justify-between">
                <p className="text-lg font-semibold capitalize">{pack}</p>
                {"badge" in cfg ? <span className="rounded-full bg-yeo-600 px-2 py-0.5 text-xs text-white">{cfg.badge}</span> : null}
              </div>
              <p className="mt-2 text-3xl font-bold">
                ${cfg.usd}
                <span className="ml-1 text-sm font-medium text-muted-foreground">{mode === "subscription" ? "/mo" : ""}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {cfg.credits} credits{mode === "subscription" ? "/month" : ""}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="size-4 text-yeo-600" /> Documents</li>
                <li className="flex items-center gap-2"><Check className="size-4 text-yeo-600" /> Templates</li>
                <li className="flex items-center gap-2"><Check className="size-4 text-yeo-600" /> PPT</li>
                <li className="flex items-center gap-2"><Check className="size-4 text-yeo-600" /> Images</li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-yeo-600" />
                  {mode === "subscription" ? "Credits reset monthly" : "No expiration"}
                </li>
                {mode === "subscription" ? <li className="flex items-center gap-2"><Check className="size-4 text-yeo-600" /> Cancel anytime</li> : null}
              </ul>
              <Button
                className="mt-5 w-full rounded-xl bg-yeo-600 hover:bg-yeo-700"
                disabled={busyKey !== null}
                onClick={() => void buy(pack)}
              >
                {busyKey === `${mode}:${pack}` ? "Connecting..." : "Buy Now ->"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
