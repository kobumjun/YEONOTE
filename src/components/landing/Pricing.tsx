import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "₩0",
    desc: "시작하기에 충분합니다.",
    features: ["월 5회 AI 생성", "템플릿 최대 10개", "기본 블록", "보내기 없음"],
    href: "/signup",
    cta: "시작하기",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/월",
    desc: "파워 유저를 위한 플랜.",
    features: ["무제한 AI", "무제한 템플릿", "모든 블록", "PDF/PNG보내기", "버전 기록"],
    href: "/signup",
    cta: "Pro로 업그레이드",
    highlight: true,
  },
  {
    name: "Team",
    price: "$19",
    period: "/월",
    desc: "팀 협업과 공유.",
    features: ["Pro 전체", "팀 워크스페이스", "공유 템플릿", "협업", "관리자 대시보드"],
    href: "/signup",
    cta: "Team 문의",
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
        <p className="mt-2 text-center text-muted-foreground">Free / Pro / Team — 필요에 맞게 선택하세요.</p>
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
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-surface-dark dark:text-white">{t.price}</span>
                  {"period" in t && t.period ? <span className="text-muted-foreground">{t.period}</span> : null}
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
