"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/shared/Logo";
import { useUiStore } from "@/stores/uiStore";
import { creditsDisplay } from "@/lib/credits";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/creations", label: "All Creations" },
  { href: "/dashboard/creations?view=trash", label: "Trash" },
  { href: "/pricing", label: "Pricing" },
  { href: "/settings", label: "Settings" },
];

function MobileNavSheet({
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
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Credits</span>
            <span>{creditsDisplay(aiCredits, aiCreditsCeiling)}</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-yeo-600 transition-all"
              style={{
                width: `${Math.max(0, Math.min(100, aiCreditsCeiling > 0 ? (aiCredits / aiCreditsCeiling) * 100 : 0))}%`,
              }}
            />
          </div>
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ size: "sm" }),
              "yeo-gradient-btn mt-2 flex w-full justify-center rounded-2xl font-semibold shadow-sm"
            )}
            onClick={() => setOpen(false)}
          >
            Get More Credits
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

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
  const router = useRouter();
  const pathname = usePathname();
  const requestPromptFocus = useUiStore((s) => s.requestPromptFocus);

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
          <MobileNavSheet
            email={email}
            displayName={displayName}
            aiCredits={aiCredits}
            aiCreditsCeiling={aiCreditsCeiling}
          />
        </Suspense>
        <Logo href="/dashboard" />
        <Button
          type="button"
          size="sm"
          className="yeo-gradient-btn ml-auto h-9 rounded-xl px-4 text-sm font-semibold shadow-sm"
          onClick={() => {
            if (pathname === "/dashboard") {
              requestPromptFocus();
            } else {
              router.push("/dashboard?focus=1");
            }
          }}
        >
          New Creation
        </Button>
      </div>
    </div>
  );
}
