"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FREE_MONTHLY_AI } from "@/lib/plan";
import { toast } from "sonner";

export default function BillingSettingsPage() {
  const [plan, setPlan] = useState("free");
  const [used, setUsed] = useState(0);
  const [portal, setPortal] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("plan,ai_generations_used")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setPlan(data.plan ?? "free");
            setUsed(data.ai_generations_used ?? 0);
          }
        });
    });
    fetch("/api/billing/portal")
      .then((r) => r.json())
      .then((j) => setPortal(j.url));
  }, []);

  async function startCheckout(target: "free" | "pro" | "team") {
    setCheckoutBusy(target);
    try {
      const res = await fetch(`/api/billing/checkout?plan=${target}`);
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "체크아웃을 열 수 없습니다.");
        return;
      }
      if (j.url) window.location.href = j.url;
      else toast.error("체크아웃 URL이 없습니다.");
    } finally {
      setCheckoutBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-lg p-4 md:p-8">
      <Link href="/settings" className="text-sm text-yeo-600 hover:underline">
        ← 설정
      </Link>
      <h1 className="mt-4 font-heading text-2xl font-semibold">결제</h1>
      <Card className="mt-6 rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg capitalize">현재 플랜: {plan}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {plan === "free" && (
            <p>
              이번 달 AI 사용: {used} / {FREE_MONTHLY_AI}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-lg"
              disabled={checkoutBusy !== null}
              onClick={() => startCheckout("free")}
            >
              {checkoutBusy === "free" ? "연결 중…" : "Free 변형 체크아웃"}
            </Button>
            <Button
              type="button"
              className="rounded-lg bg-yeo-600"
              size="sm"
              disabled={checkoutBusy !== null}
              onClick={() => startCheckout("pro")}
            >
              {checkoutBusy === "pro" ? "연결 중…" : "Pro 업그레이드"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={checkoutBusy !== null}
              onClick={() => startCheckout("team")}
            >
              {checkoutBusy === "team" ? "연결 중…" : "Team 업그레이드"}
            </Button>
          </div>
          <p className="text-xs">
            한 개의 Lemon 제품(<code className="rounded bg-muted px-1">LEMONSQUEEZY_PRODUCT_ID</code>)에 여러 변형으로 연결됩니다.
          </p>
          {portal ? (
            <a
              href={portal}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex rounded-lg")}
            >
              결제 포털 열기
            </a>
          ) : (
            <p className="text-xs">Lemon Squeezy 포털 URL을 환경 변수에 설정하세요.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
