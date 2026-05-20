"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/shared/Logo";
import { planLabel, type UserPlan } from "@/lib/subscription";

const links = [
  { href: "/dashboard", label: "Decks" },
  { href: "/pricing", label: "Pricing" },
  { href: "/settings", label: "Settings" },
];

function MobileNavSheet({
  email,
  displayName,
  plan,
}: {
  email: string;
  displayName: string;
  plan: UserPlan;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    setOpen(false);
  }, [routeKey]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(buttonVariants({ variant: "outline", size: "icon" }), "rounded-xl border-border")}
        aria-label="Menu"
      >
        <Menu className="size-4 stroke-[1.5]" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-border/80 bg-background/95 backdrop-blur-xl">
        <SheetHeader>
          <SheetTitle className="text-left">
            <Logo href="/dashboard" />
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl px-3 py-2 text-sm transition-colors duration-200 hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-3 text-sm">
          <p className="font-medium text-foreground">{displayName || "User"}</p>
          <p className="truncate text-xs text-muted-foreground">{email || "—"}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {planLabel(plan)} plan
          </p>
          {plan === "free" && (
            <Link
              href="/pricing"
              className={cn(
                buttonVariants({ size: "sm" }),
                "mt-2 flex w-full justify-center rounded-2xl bg-[#6C5CE7] font-semibold text-white shadow-sm hover:bg-[#5A4BD1]"
              )}
              onClick={() => setOpen(false)}
            >
              Upgrade
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MobileNav({
  email,
  displayName,
  plan,
}: {
  email: string;
  displayName: string;
  plan: UserPlan;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-col border-b border-border/80 bg-background/85 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <Suspense
          fallback={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl border-border"
              disabled
              aria-label="Menu"
            >
              <Menu className="size-4 stroke-[1.5]" />
            </Button>
          }
        >
          <MobileNavSheet email={email} displayName={displayName} plan={plan} />
        </Suspense>
        <Logo href="/dashboard" />
        <Button
          type="button"
          size="sm"
          className="ml-auto h-9 rounded-xl bg-[#6C5CE7] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#5A4BD1]"
          onClick={() => {
            if (pathname === "/dashboard") {
              window.dispatchEvent(new CustomEvent("yeo:new-deck"));
            } else {
              router.push("/dashboard");
            }
          }}
        >
          New Deck
        </Button>
      </div>
    </div>
  );
}
