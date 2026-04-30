import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { PRO_CREDIT_PACK_CREDITS, PRO_CREDIT_PACK_USD, TEAM_CREDIT_PACK_CREDITS, TEAM_CREDIT_PACK_USD } from "@/lib/credits";

const tiers = [
  {
    name: "Free",
    price: "₩0",
    desc: "새 계정 기본 상태입니다.",
    features: ["AI 크레딧 0", "기본 블록", "AI 생성 불가", "수동 템플릿 생성 가능"],
    href: "/login",
    cta: "시작하기",
    highlight: false,
  },
  {
    name: "Pro",
    price: `$${PRO_CREDIT_PACK_USD}`,
    priceNote: "일회성",
    desc: "AI로 템플릿을 풍부하게 만들 때.",
    features: [
      `${PRO_CREDIT_PACK_CREDITS} AI 크레딧`,
      "모든 블록",
      "PDF/PNG보내기",
      "버전 기록",
    ],
    href: "/login?next=/settings/billing",
    cta: "크레딧 구매하기",
    highlight: true,
  },
  {
    name: "Team",
    price: `$${TEAM_CREDIT_PACK_USD}`,
    priceNote: "일회성",
    desc: "팀 단위로 더 많이 쓸 때.",
    features: [
      `${TEAM_CREDIT_PACK_CREDITS} AI 크레딧`,
      "Pro 전체",
      "팀 워크스페이스",
      "공유 템플릿",
    ],
    href: "/login?next=/settings/billing",
    cta: "크레딧 구매하기",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-surface px-4 py-20 dark:bg-slate-950/50">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-heading text-2xl font-semibold text-surface-dark dark:text-white sm:text-3xl">
          요금제
        </h2>
        <p className="mt-2 text-center text-muted-foreground">일회성 크레딧 구매 — 월 구독이 아닙니다.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <Card
              key={t.name}
              className={`flex flex-col rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md ${
                t.highlight ? "border-yeo-400 ring-2 ring-yeo-500/20 dark:border-yeo-600" : ""
              }`}
            >
              <CardHeader>
                <CardTitle className="text-lg">{t.name}</CardTitle>
                <CardDescription>{t.desc}</CardDescription>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-1 gap-y-0">
                  <span className="text-3xl font-bold text-surface-dark dark:text-white">{t.price}</span>
                  {"priceNote" in t && t.priceNote ? (
                    <span className="text-sm text-muted-foreground">({t.priceNote})</span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-yeo-600" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link
                  href={t.href}
                  className={cn(
                    buttonVariants({ variant: t.highlight ? "default" : "outline" }),
                    "w-full justify-center rounded-lg"
                  )}
                >
                  {t.cta}
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
