"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/shared/Logo";
import { useUiStore } from "@/stores/uiStore";
import { creditsDisplay } from "@/lib/credits";

const links = [
  { href: "/dashboard", label: "All Templates" },
  { href: "/dashboard?view=favorites", label: "Favorites" },
  { href: "/explore", label: "Explore" },
  { href: "/settings", label: "Settings" },
];

export function MobileNav({
  email,
  displayName,
  aiCredits,
  aiCreditsCeiling,
}: {
  email: string;
  displayName: string;
  aiCredits: number;
  aiCreditsCeiling: number;
}) {
  const setGenerateOpen = useUiStore((s) => s.setGenerateOpen);

  return (
    <div className="flex flex-col border-b border-border bg-background md:hidden">
      <div className="flex items-center gap-2 px-4 py-2">
        <Sheet>
          <SheetTrigger
            className={cn(buttonVariants({ variant: "outline", size: "icon" }), "rounded-xl border-border")}
            aria-label="Menu"
          >
            <Menu className="size-4 stroke-[1.5]" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-border bg-background">
            <SheetHeader>
              <SheetTitle className="text-left">
                <Logo href="/dashboard" />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-xl px-3 py-2 text-sm transition-colors duration-200 hover:bg-muted">
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium text-foreground">{displayName || "User"}</p>
              <p className="truncate text-xs text-muted-foreground">{email || "—"}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                AI Credits: {creditsDisplay(aiCredits, aiCreditsCeiling)} remaining
              </p>
              <Link
                href="/settings/billing"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "mt-2 flex w-full justify-center rounded-xl bg-yeo-600 text-primary-foreground shadow-sm transition-all duration-200 hover:bg-yeo-700"
                )}
              >
                Top Up
              </Link>
            </div>
          </SheetContent>
        </Sheet>
        <Logo href="/dashboard" />
        <Button type="button" size="sm" className="ml-auto rounded-xl bg-yeo-600 shadow-sm" onClick={() => setGenerateOpen(true)}>
          New Template
        </Button>
      </div>
    </div>
  );
}
