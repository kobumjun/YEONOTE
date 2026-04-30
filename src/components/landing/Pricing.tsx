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
    price: "$0",
    desc: "Start free and build manually with the block editor.",
    features: [
      `${TUTORIAL_SIGNUP_CREDITS} tutorial credits`,
      "Basic block editor",
      "Manual template creation",
    ],
    href: "/login",
    cta: "Get Started Free",
    highlight: false,
    badge: null as string | null,
  },
  {
    name: "Pro",
    price: `$${PRO_CREDIT_PACK_USD}`,
    desc: "For power users who generate templates with AI often.",
    features: [
      `${PRO_CREDIT_PACK_CREDITS} AI credits`,
      "All block types",
      "PDF & PNG export",
      "Version history",
    ],
    href: "/login?next=/settings/billing",
    cta: "Buy Credits",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Team",
    price: `$${TEAM_CREDIT_PACK_USD}`,
    desc: "For teams that need more credits and collaboration headroom.",
    features: [
      `${TEAM_CREDIT_PACK_CREDITS} AI credits`,
      "Everything in Pro",
      "Team workspace",
      "Shared templates",
    ],
    href: "/login?next=/settings/billing",
    cta: "Buy Credits",
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
        <p className="mt-2 text-center text-sm text-muted-foreground">Buy credits when you need them. No monthly lock-in.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <Card
              key={t.name}
              className={cn(
                "relative flex flex-col rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md",
                t.highlight && "border-yeo-500/40 ring-1 ring-yeo-500/20"
              )}
            >
              {t.badge ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-border bg-yeo-600 px-3 py-0.5 text-xs font-medium text-primary-foreground shadow-sm">
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
