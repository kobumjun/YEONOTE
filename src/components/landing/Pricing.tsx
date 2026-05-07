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
    name: "무료",
    price: "$0",
    desc: "무료로 시작하고 블록 에디터로 직접 템플릿을 만들어 보세요.",
    features: [
      `가입 시 튜토리얼 크레딧 ${TUTORIAL_SIGNUP_CREDITS}개`,
      "기본 블록 에디터",
      "수동 템플릿 작성",
    ],
    href: "/login",
    cta: "무료로 시작하기",
    highlight: false,
    badge: null as string | null,
  },
  {
    name: "Pro",
    price: `$${PRO_CREDIT_PACK_USD}`,
    desc: "AI로 템플릿을 자주 만드는 분께 추천해요.",
    features: [
      `AI 크레딧 ${PRO_CREDIT_PACK_CREDITS}개`,
      "모든 블록 타입",
      "PDF·PNG보내기",
      "버전 기록",
    ],
    href: "/login?next=/settings/billing",
    cta: "크레딧 구매하기",
    highlight: true,
    badge: "가장 인기",
  },
  {
    name: "Team",
    price: `$${TEAM_CREDIT_PACK_USD}`,
    desc: "크레딧이 더 필요하고 팀 단위로 쓰고 싶을 때.",
    features: [
      `AI 크레딧 ${TEAM_CREDIT_PACK_CREDITS}개`,
      "Pro의 모든 기능",
      "팀 워크스페이스",
      "공유 템플릿",
    ],
    href: "/login?next=/settings/billing",
    cta: "크레딧 구매하기",
    highlight: false,
    badge: null as string | null,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-t border-border bg-muted/30 px-4 py-20 dark:bg-muted/10">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
          요금제
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">필요할 때만 크레딧을 구매하세요. 월 정액에 묶이지 않아요.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <Card
              key={t.name}
              className={cn(
                "relative flex flex-col overflow-visible rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md",
                t.highlight && "border-yeo-500/40 ring-1 ring-yeo-500/20"
              )}
            >
              {t.badge ? (
                <span className="absolute right-4 top-4 inline-flex rounded-full bg-yeo-600 px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-sm">
                  {t.badge}
                </span>
              ) : null}
              <CardHeader>
                <CardTitle className="text-lg">{t.name}</CardTitle>
                <CardDescription>{t.desc}</CardDescription>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-1 gap-y-0">
                  <span className="text-3xl font-bold tracking-[-0.02em] text-foreground">{t.price}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-yeo-600 stroke-[1.5]" />
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
                    "w-full justify-center rounded-xl transition-all duration-200"
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
