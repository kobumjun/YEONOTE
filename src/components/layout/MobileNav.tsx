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
  { href: "/dashboard", label: "모든 템플릿" },
  { href: "/dashboard?view=favorites", label: "즐겨찾기" },
  { href: "/explore", label: "탐색" },
  { href: "/settings", label: "설정" },
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
    <div className="flex flex-col border-b md:hidden">
      <div className="flex items-center gap-2 px-4 py-2">
        <Sheet>
          <SheetTrigger
            className={cn(buttonVariants({ variant: "outline", size: "icon" }), "rounded-lg")}
            aria-label="메뉴"
          >
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-left">
                <Logo href="/dashboard" />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm hover:bg-muted">
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-medium text-foreground">{displayName || "사용자"}</p>
              <p className="truncate text-xs text-muted-foreground">{email || "—"}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                🔥 AI 크레딧: {creditsDisplay(aiCredits, aiCreditsCeiling)} 남음
              </p>
              <Link
                href="/settings/billing"
                className={cn(buttonVariants({ size: "sm" }), "mt-2 flex w-full justify-center rounded-lg bg-yeo-600 text-primary-foreground hover:bg-yeo-700")}
              >
                충전하기
              </Link>
            </div>
          </SheetContent>
        </Sheet>
        <Logo href="/dashboard" />
        <Button type="button" size="sm" className="ml-auto rounded-lg bg-yeo-600" onClick={() => setGenerateOpen(true)}>
          새 템플릿
        </Button>
      </div>
    </div>
  );
}
