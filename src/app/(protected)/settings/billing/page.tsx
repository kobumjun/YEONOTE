"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FREE_MONTHLY_AI } from "@/lib/plan";
import { toast } from "sonner";

type LemonConfig = {
  productId: string | null;
  storeConfigured: boolean;
  apiKeyConfigured: boolean;
  variants: {
    free: { configured: boolean };
    pro: { configured: boolean };
    team: { configured: boolean };
  };
};

export default function BillingSettingsPage() {
  const [plan, setPlan] = useState("free");
  const [used, setUsed] = useState(0);
  const [portal, setPortal] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState<string | null>(null);
  const [lemon, setLemon] = useState<LemonConfig | null>(null);

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
    fetch("/api/billing/config")
      .then(async (r) => {
        const j = await r.json();
        if (r.ok && j.lemon) setLemon(j.lemon);
      })
      .catch(() => setLemon(null));
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

  function variantLabel(key: keyof LemonConfig["variants"], label: string) {
    const ok = lemon?.variants[key]?.configured;
    return (
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={ok ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
          {ok ? "설정됨" : "미설정"}
        </span>
      </span>
    );
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

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-foreground">
            <p className="font-medium text-surface-dark dark:text-white">Lemon Squeezy (서버 설정)</p>
            {lemon ? (
              <ul className="mt-2 space-y-1">
                <li>
                  제품 ID:{" "}
                  <span className="font-mono text-foreground">{lemon.productId ?? "— (미설정)"}</span>
                </li>
                <li>스토어: {lemon.storeConfigured ? "설정됨" : "미설정"}</li>
                <li>API 키: {lemon.apiKeyConfigured ? "설정됨" : "미설정"}</li>
                <li className="pt-1">
                  변형 — {variantLabel("free", "Free")} · {variantLabel("pro", "Pro")} ·{" "}
                  {variantLabel("team", "Team")}
                </li>
              </ul>
            ) : (
              <p className="mt-2 text-muted-foreground">설정 정보를 불러오는 중이거나 로드에 실패했습니다.</p>
            )}
            <p className="mt-2 text-muted-foreground">
              값은 서버의 <span className="font-medium">환경 변수</span>에서만 읽으며, 브라우저에 비밀 키를 넣지 않습니다.
            </p>
          </div>

          {portal ? (
            <a
              href={portal}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline" }), "inline-flex rounded-lg")}
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
