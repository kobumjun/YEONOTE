"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getLemonVariantIdForSubscription } from "@/lib/lemon-checkout-client";
import { createClient } from "@/lib/supabase/client";
import { withAuth } from "@/lib/auth-fetch";
import { cn } from "@/lib/utils";
import { normalizePlan, planLabel, type UserPlan } from "@/lib/subscription";
import type { BillingInterval } from "@/lib/lemon-billing";

const PLANS: {
  id: UserPlan;
  name: string;
  monthly: number;
  yearly: number;
  features: string[];
}[] = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    yearly: 0,
    features: ["8 AI requests/day", "2 active decks", "10 slides/deck", "PDF export (watermark)"],
  },
  {
    id: "plus",
    name: "Plus",
    monthly: 15,
    yearly: 12,
    features: [
      "Unlimited AI",
      "Unlimited decks",
      "50 slides/deck",
      "PPTX export",
      "Web research",
      "No watermark",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 30,
    yearly: 24,
    features: [
      "Everything in Plus",
      "Deck review & coaching",
      "Audience optimization",
      "Competitive analysis",
      "Team collaboration (soon)",
    ],
  },
];

export function PricingClient() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [currentPlan, setCurrentPlan] = useState<UserPlan>("free");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setCurrentPlan(normalizePlan(data.plan));
        });
    });
  }, []);

  async function handleUpgrade(plan: UserPlan) {
    if (plan === "free") return;
    setBusy(plan);
    try {
      const variantId = getLemonVariantIdForSubscription(plan, interval);
      if (!variantId) {
        toast.error("Checkout is not configured. Set LemonSqueezy variant env vars.");
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
        toast.error(j.error ?? "Failed to open checkout");
        return;
      }
      if (j.url) window.location.href = j.url;
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Choose your plan</h1>
        <p className="mt-2 text-muted-foreground">Build presentations that impress.</p>
        <div className="mt-6 inline-flex rounded-xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              interval === "monthly" ? "bg-white shadow-sm" : "text-muted-foreground"
            )}
            onClick={() => setInterval("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              interval === "yearly" ? "bg-white shadow-sm" : "text-muted-foreground"
            )}
            onClick={() => setInterval("yearly")}
          >
            Yearly — Save 20%
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => {
          const price = interval === "monthly" ? p.monthly : p.yearly;
          const isCurrent = currentPlan === p.id;
          return (
            <div
              key={p.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-white p-6 shadow-sm",
                p.id === "plus" && "border-[#6C5CE7] ring-2 ring-[#6C5CE7]/20"
              )}
            >
              <h2 className="text-lg font-bold">{p.name}</h2>
              <p className="mt-2">
                <span className="text-3xl font-bold">${price}</span>
                {p.id !== "free" && (
                  <span className="text-sm text-muted-foreground">/mo</span>
                )}
              </p>
              <ul className="mt-6 flex-1 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#6C5CE7]" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <Button variant="outline" className="mt-6 rounded-xl" disabled>
                  Current plan
                </Button>
              ) : p.id === "free" ? (
                <Button variant="outline" className="mt-6 rounded-xl" disabled>
                  Free forever
                </Button>
              ) : (
                <Button
                  className="mt-6 rounded-xl bg-[#6C5CE7] hover:bg-[#5A4BD1]"
                  disabled={busy === p.id}
                  onClick={() => void handleUpgrade(p.id)}
                >
                  {busy === p.id ? "Loading…" : `Upgrade to ${p.name}`}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        You are on the <strong>{planLabel(currentPlan)}</strong> plan.
      </p>
    </div>
  );
}
