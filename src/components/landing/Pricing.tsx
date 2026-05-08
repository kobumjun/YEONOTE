import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { CREDIT_PACKS, TUTORIAL_SIGNUP_CREDITS } from "@/lib/credits";

const tiers = [
  {
    name: "Free",
    price: "$0",
    desc: "Start free and build templates directly with the block editor.",
    features: [
      `${TUTORIAL_SIGNUP_CREDITS} tutorial credits on signup`,
      "Core block editor",
      "Manual template building",
    ],
    href: "/login",
    cta: "Get Started Free",
    highlight: false,
    badge: null as string | null,
  },
  {
    name: "Growth",
    price: `$${CREDIT_PACKS.one_time.growth.usd}`,
    desc: "Best for people who generate templates frequently with AI.",
    features: [
      `${CREDIT_PACKS.one_time.growth.credits} AI credits`,
      "All block types",
      "PDF/PNG export",
      "Version history",
    ],
    href: "/login?next=/pricing",
    cta: "Buy credits",
    highlight: true,
    badge: "Most popular",
  },
  {
    name: "Bulk",
    price: `$${CREDIT_PACKS.one_time.bulk.usd}`,
    desc: "For teams that need more credits.",
    features: [
      `${CREDIT_PACKS.one_time.bulk.credits} AI credits`,
      "Everything in Growth",
      "Best value pack",
      "No expiration",
    ],
    href: "/login?next=/pricing",
    cta: "Buy credits",
    highlight: false,
    badge: null as string | null,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-t border-border bg-muted/30 px-4 py-20 dark:bg-muted/10">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
          Pricing
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">Buy credits only when you need them. No monthly lock-in.</p>
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
