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
        toast.error(j.error ?? "결제 페이지를 열 수 없습니다.");
        return;
      }
      if (j.url) window.location.href = j.url;
      else toast.error("결제 링크를 받지 못했습니다.");
    } finally {
      setCheckoutBusy(null);
    }
  }

  const isFree = plan === "free";

  return (
    <div className="mx-auto max-w-lg p-4 md:p-8">
      <Link href="/settings" className="text-sm text-yeo-600 hover:underline">
        ← 설정
      </Link>
      <h1 className="mt-4 font-heading text-2xl font-semibold">결제</h1>

      <Card className="mt-6 rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">현재 플랜</CardTitle>
          <CardDescription>
            {isFree
              ? `신규 가입 시 튜토리얼 크레딧 ${TUTORIAL_SIGNUP_CREDITS}개를 드립니다. AI 기능을 체험해보세요!`
              : `현재 ${plan === "team" ? "Team" : "Pro"} 혜택을 이용 중입니다.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p className="text-foreground">
            남은 크레딧: <span className="font-semibold">{credits}개</span>
          </p>
          <Button type="button" variant="secondary" size="sm" className="rounded-lg" disabled>
            {isFree ? "현재 플랜" : `${plan === "team" ? "Team" : "Pro"} 플랜 이용 중`}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">크레딧 충전</CardTitle>
          <CardDescription>크레딧을 충전하고 더 많은 템플릿을 AI로 생성하세요.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col rounded-xl border bg-card p-4">
            <p className="text-sm font-medium text-foreground">Pro</p>
            <p className="mt-2 text-2xl font-bold text-foreground">${PRO_CREDIT_PACK_USD}</p>
            <p className="mt-1 text-sm text-muted-foreground">{PRO_CREDIT_PACK_CREDITS} AI 크레딧</p>
            <Button
              type="button"
              className="mt-4 rounded-lg bg-yeo-600"
              size="sm"
              disabled={checkoutBusy !== null}
              onClick={() => void startCheckout("pro")}
            >
              {checkoutBusy === "pro" ? "연결 중…" : "구매하기"}
            </Button>
          </div>
          <div className="flex flex-col rounded-xl border bg-card p-4">
            <p className="text-sm font-medium text-foreground">Team</p>
            <p className="mt-2 text-2xl font-bold text-foreground">${TEAM_CREDIT_PACK_USD}</p>
            <p className="mt-1 text-sm text-muted-foreground">{TEAM_CREDIT_PACK_CREDITS} AI 크레딧</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 rounded-lg"
              size="sm"
              disabled={checkoutBusy !== null}
              onClick={() => void startCheckout("team")}
            >
              {checkoutBusy === "team" ? "연결 중…" : "구매하기"}
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
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex rounded-lg")}
          >
            결제 내역 및 영수증
          </a>
        </div>
      ) : null}
    </div>
  );
}
