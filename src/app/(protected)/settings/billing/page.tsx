"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import {
  PRO_CREDIT_PACK_CREDITS,
  PRO_CREDIT_PACK_USD,
  TEAM_CREDIT_PACK_CREDITS,
  TEAM_CREDIT_PACK_USD,
  TUTORIAL_SIGNUP_CREDITS,
} from "@/lib/credits";

export default function BillingSettingsPage() {
  const [plan, setPlan] = useState("free");
  const [credits, setCredits] = useState(0);
  const [portal, setPortal] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("plan, ai_credits")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setPlan(data.plan ?? "free");
            setCredits(data.ai_credits ?? 0);
          }
        });
    });
    fetch("/api/billing/portal")
      .then((r) => r.json())
      .then((j) => (typeof j.url === "string" && j.url ? setPortal(j.url) : setPortal(null)))
      .catch(() => setPortal(null));
  }, []);

  async function startCheckout(target: "pro" | "team") {
    setCheckoutBusy(target);
    try {
      const res = await fetch(`/api/billing/checkout?plan=${target}`);
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Could not open checkout");
        return;
      }
      if (j.url) window.location.href = j.url;
      else toast.error("Missing checkout link.");
    } finally {
      setCheckoutBusy(null);
    }
  }

  const isFree = plan === "free";

  return (
    <div className="mx-auto max-w-lg p-4 md:p-8">
      <Link href="/settings" className="text-sm text-yeo-600 transition-colors duration-200 hover:underline">
        ← Settings
      </Link>
      <h1 className="mt-4 font-heading text-2xl font-semibold tracking-[-0.02em]">Billing</h1>

      <Card className="mt-6 rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Current Plan</CardTitle>
          <CardDescription>
            {isFree
              ? `New accounts include ${TUTORIAL_SIGNUP_CREDITS} tutorial credits to try AI features.`
              : `You are on the ${plan === "team" ? "Team" : "Pro"} pack.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p className="text-foreground">
            Credits remaining: <span className="font-semibold">{credits}</span>
          </p>
          <Button type="button" variant="secondary" size="sm" className="rounded-xl" disabled>
            {isFree ? "Current plan" : `${plan === "team" ? "Team" : "Pro"} active`}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Top Up Credits</CardTitle>
          <CardDescription>Buy credits when you need more AI-generated templates.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm font-medium text-foreground">Pro</p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.02em] text-foreground">${PRO_CREDIT_PACK_USD}</p>
            <p className="mt-1 text-sm text-muted-foreground">{PRO_CREDIT_PACK_CREDITS} AI credits</p>
            <Button
              type="button"
              className="mt-4 rounded-xl bg-yeo-600 shadow-sm"
              size="sm"
              disabled={checkoutBusy !== null}
              onClick={() => void startCheckout("pro")}
            >
              {checkoutBusy === "pro" ? "Connecting…" : "Purchase"}
            </Button>
          </div>
          <div className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm font-medium text-foreground">Team</p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.02em] text-foreground">${TEAM_CREDIT_PACK_USD}</p>
            <p className="mt-1 text-sm text-muted-foreground">{TEAM_CREDIT_PACK_CREDITS} AI credits</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 rounded-xl"
              size="sm"
              disabled={checkoutBusy !== null}
              onClick={() => void startCheckout("team")}
            >
              {checkoutBusy === "team" ? "Connecting…" : "Purchase"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {portal ? (
        <div className="mt-6">
          <a
            href={portal}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex rounded-xl border-border")}
          >
            Billing history & receipts
          </a>
        </div>
      ) : null}
    </div>
  );
}
