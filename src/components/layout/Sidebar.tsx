"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  LayoutGrid,
  Trash2,
  CreditCard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { creditsDisplay } from "@/lib/credits";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV_LINKS = [
  { href: "/dashboard", label: "Home", icon: Home, key: "home" as const },
  { href: "/dashboard/creations", label: "All Creations", icon: LayoutGrid, key: "creations" as const },
  { href: "/dashboard/creations?view=trash", label: "Trash", icon: Trash2, key: "trash" as const },
  { href: "/pricing", label: "Pricing", icon: CreditCard, key: "pricing" as const },
  { href: "/settings", label: "Settings", icon: Settings, key: "settings" as const },
];

function navActive(
  key: (typeof NAV_LINKS)[number]["key"],
  pathname: string,
  creationsView: string | null | undefined
): boolean {
  if (key === "home") return pathname === "/dashboard";
  if (key === "creations") {
    return pathname === "/dashboard/creations" && creationsView !== "trash";
  }
  if (key === "trash") {
    return pathname === "/dashboard/creations" && creationsView === "trash";
  }
  if (key === "pricing") return pathname === "/pricing" || pathname.startsWith("/pricing/");
  if (key === "settings") return pathname === "/settings" || pathname.startsWith("/settings/");
  return false;
}

function SidebarNavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const creationsView =
    pathname === "/dashboard/creations" ? searchParams.get("view") ?? undefined : undefined;

  return (
    <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
      {NAV_LINKS.map(({ href, label, icon: Icon, key }) => {
        const active = navActive(key, pathname, creationsView);
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
              active
                ? "bg-violet-500/12 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <Icon className="size-[18px] shrink-0 stroke-[1.75]" aria-hidden />
            <span className="min-w-0 truncate opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarNavFallback() {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
      {NAV_LINKS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          title={label}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
        >
          <Icon className="size-[18px] shrink-0 stroke-[1.75]" />
          <span className="min-w-0 truncate opacity-0">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function Sidebar({
  aiCredits,
  aiCreditsCeiling,
  displayName,
  email,
  avatarUrl,
}: {
  aiCredits: number;
  aiCreditsCeiling: number;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const initials = (displayName || email || "U").slice(0, 2).toUpperCase();
  const pct = Math.max(0, Math.min(100, aiCreditsCeiling > 0 ? (aiCredits / aiCreditsCeiling) * 100 : 0));

  return (
    <aside
      className={cn(
        "group/sidebar sticky top-0 z-40 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/85 text-sidebar-foreground shadow-sm backdrop-blur-xl transition-[width] duration-300 ease-out md:flex",
        "w-16 hover:w-52"
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-3">
        <Link
          href="/dashboard"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-sm font-bold text-white shadow-sm"
          aria-label="YEO Home"
        >
          Y
        </Link>
        <span className="min-w-0 truncate text-sm font-semibold tracking-tight opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
          YEO
        </span>
      </div>

      <Suspense fallback={<SidebarNavFallback />}>
        <SidebarNavLinks />
      </Suspense>

      <div className="mt-auto space-y-3 border-t border-sidebar-border p-3">
        {/* Narrow: credit count circle only (links to pricing) */}
        <div className="flex justify-center group-hover/sidebar:hidden">
          <Link
            href="/pricing"
            title={`${creditsDisplay(aiCredits, aiCreditsCeiling)} — Get credits`}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[10px] font-semibold tabular-nums text-violet-700 ring-1 ring-violet-500/20 transition-colors hover:bg-violet-500/15 dark:bg-violet-500/20 dark:text-violet-200 dark:ring-violet-400/30 dark:hover:bg-violet-500/30"
          >
            {aiCredits}
          </Link>
        </div>

        {/* Expanded: bar + Get credits */}
        <div className="hidden space-y-3 group-hover/sidebar:block">
          <div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Credits</span>
              <span className="font-medium tabular-nums text-foreground">{creditsDisplay(aiCredits, aiCreditsCeiling)}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-600 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <Link
            href="/pricing"
            className="yeo-gradient-btn flex w-full items-center justify-center rounded-xl py-2.5 text-center text-xs font-semibold shadow-sm"
          >
            Get credits
          </Link>
        </div>

        <button
          type="button"
          onClick={() => router.push("/settings")}
          className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-muted/80"
        >
          <Avatar className="size-9 shrink-0 border border-sidebar-border">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{displayName || "User"}</p>
            <p className="truncate text-xs text-muted-foreground">{email || "—"}</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
