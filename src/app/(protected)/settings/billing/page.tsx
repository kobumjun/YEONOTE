"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import {
  PRO_CREDIT_PACK_CREDITS,
  PRO_CREDIT_PACK_USD,
  TEAM_CREDIT_PACK_CREDITS,
  TEAM_CREDIT_PACK_USD,
  creditsDisplay,
} from "@/lib/credits";

type LemonConfig = {
  productId: string | null;
  storeIdConfigured: boolean;
  storeSlugConfigured: boolean;
  storeSlug: string | null;
  apiKeyConfigured: boolean;
  packs: {
    pro: { configured: boolean };
    team: { configured: boolean };
  };
};

export default function BillingSettingsPage() {
  const [plan, setPlan] = useState("free");
  const [credits, setCredits] = useState(0);
  const [ceiling, setCeiling] = useState(0);
  const [portal, setPortal] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState<string | null>(null);
  const [lemon, setLemon] = useState<LemonConfig | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("plan, ai_credits, ai_credits_ceiling")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setPlan(data.plan ?? "free");
            setCredits(data.ai_credits ?? 0);
            setCeiling(data.ai_credits_ceiling ?? 0);
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

  async function startCheckout(target: "pro" | "team") {
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

  function packLabel(key: keyof LemonConfig["packs"], label: string) {
    const ok = lemon?.packs[key]?.configured;
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
          <CardTitle className="text-lg">Free</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>신규 사용자 기본 플랜입니다. AI 크레딧은 포함되지 않으며, Lemon Squeezy 결제 없이 바로 사용할 수 있습니다.</p>
          {plan === "free" ? (
            <p className="rounded-lg border border-yeo-200 bg-yeo-50/80 px-3 py-2 text-foreground dark:border-yeo-800 dark:bg-yeo-950/40">
              현재 플랜
            </p>
          ) : null}
          <p>
            남은 AI 크레딧: <span className="font-medium text-foreground">{creditsDisplay(credits, ceiling)}</span>
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">크레딧 충전 (일회성)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Pro: <span className="font-medium text-foreground">${PRO_CREDIT_PACK_USD}</span> 일회성 ·{" "}
            <span className="font-medium text-foreground">{PRO_CREDIT_PACK_CREDITS} AI 크레딧</span>
          </p>
          <p>
            Team: <span className="font-medium text-foreground">${TEAM_CREDIT_PACK_USD}</span> 일회성 ·{" "}
            <span className="font-medium text-foreground">{TEAM_CREDIT_PACK_CREDITS} AI 크레딧</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-lg bg-yeo-600"
              size="sm"
              disabled={checkoutBusy !== null}
              onClick={() => void startCheckout("pro")}
            >
              {checkoutBusy === "pro" ? "연결 중…" : `Pro 크레딧 구매 ($${PRO_CREDIT_PACK_USD})`}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={checkoutBusy !== null}
              onClick={() => void startCheckout("team")}
            >
              {checkoutBusy === "team" ? "연결 중…" : `Team 크레딧 구매 ($${TEAM_CREDIT_PACK_USD})`}
            </Button>
          </div>
          {plan !== "free" ? (
            <p className="text-xs text-foreground">구매한 플랜: {plan} — PDF/PNG보내기 등 Pro·Team 혜택이 적용됩니다.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg text-muted-foreground">Lemon Squeezy (서버 설정)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-foreground">
          {lemon ? (
            <ul className="space-y-1">
              <li>
                제품 ID: <span className="font-mono">{lemon.productId ?? "— (미설정)"}</span>
              </li>
              <li>스토어 ID(API): {lemon.storeIdConfigured ? "설정됨" : "미설정"}</li>
              <li>
                스토어 슬러그:{" "}
                {lemon.storeSlugConfigured ? <span className="font-mono">{lemon.storeSlug}</span> : "미설정"}
              </li>
              <li>API 키: {lemon.apiKeyConfigured ? "설정됨" : "미설정"}</li>
              <li className="pt-1">
                변형 — {packLabel("pro", "Pro")} · {packLabel("team", "Team")}
              </li>
            </ul>
          ) : (
            <p className="text-muted-foreground">설정 정보를 불러오는 중이거나 로드에 실패했습니다.</p>
          )}
          <p className="text-muted-foreground">
            값은 서버의 <span className="font-medium">환경 변수</span>에서만 읽으며, 브라우저에 비밀 키를 넣지 않습니다.
          </p>
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
            <p className="text-muted-foreground">Lemon Squeezy 포털 URL을 환경 변수에 설정하세요.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
