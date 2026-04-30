import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import {
  PRO_CREDIT_PACK_CREDITS,
  PRO_CREDIT_PACK_USD,
  TEAM_CREDIT_PACK_CREDITS,
  TEAM_CREDIT_PACK_USD,
  TUTORIAL_SIGNUP_CREDITS,
} from "@/lib/credits";

const tiers = [
  {
    name: "Free",
    price: "₩0",
    desc: "바로 시작하고 에디터로 만들어 보세요.",
    features: [
      `튜토리얼 크레딧 ${TUTORIAL_SIGNUP_CREDITS}개 포함`,
      "기본 블록 에디터",
      "수동 템플릿 생성",
    ],
    href: "/login",
    cta: "무료로 시작하기",
    highlight: false,
  },
  {
    name: "Pro",
    price: `$${PRO_CREDIT_PACK_USD}`,
    desc: "AI로 풍부한 템플릿을 만들 때.",
    features: [
      `${PRO_CREDIT_PACK_CREDITS} AI 크레딧`,
      "모든 블록 타입",
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
    desc: "팀과 함께 더 크게 쓸 때.",
    features: [
      `${TEAM_CREDIT_PACK_CREDITS} AI 크레딧`,
      "Pro 전체 기능",
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
        <p className="mt-2 text-center text-muted-foreground">필요할 때마다 크레딧만 충전하세요.</p>
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
