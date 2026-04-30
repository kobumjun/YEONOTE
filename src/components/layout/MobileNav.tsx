"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/shared/Logo";
import { useUiStore } from "@/stores/uiStore";

const links = [
  { href: "/dashboard", label: "모든 템플릿" },
  { href: "/dashboard?view=favorites", label: "즐겨찾기" },
  { href: "/explore", label: "탐색" },
  { href: "/settings", label: "설정" },
];

export function MobileNav({ email }: { email: string }) {
  const setGenerateOpen = useUiStore((s) => s.setGenerateOpen);

  return (
    <div className="flex items-center gap-2 border-b px-4 py-2 md:hidden">
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
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="mt-6 truncate text-xs text-muted-foreground">{email}</p>
        </SheetContent>
      </Sheet>
      <Logo href="/dashboard" />
      <Button type="button" size="sm" className="ml-auto rounded-lg bg-yeo-600" onClick={() => setGenerateOpen(true)}>
        새 템플릿
      </Button>
    </div>
  );
}
