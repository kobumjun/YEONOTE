"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Star,
  Trash2,
  CreditCard,
  Settings,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { useUiStore } from "@/stores/uiStore";
import { creditsDisplay } from "@/lib/credits";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const links = [
  { href: "/dashboard", label: "All Creations", icon: LayoutDashboard, dashboardView: "all" as const },
  { href: "/dashboard?view=my", label: "My Work", icon: FileText, dashboardView: "my" as const },
  { href: "/dashboard?view=favorites", label: "Favorites", icon: Star, dashboardView: "favorites" as const },
  { href: "/dashboard?view=trash", label: "Trash", icon: Trash2, dashboardView: "trash" as const },
  { href: "/pricing", label: "Pricing", icon: CreditCard, dashboardView: null },
  { href: "/explore", label: "Explore", icon: Sparkles, dashboardView: null },
  { href: "/settings", label: "Settings", icon: Settings, dashboardView: null },
];

function SidebarNavLinks({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentDashView = pathname === "/dashboard" ? searchParams.get("view") ?? "all" : null;

  function isActive(href: string, dashboardView: string | null): boolean {
    if (dashboardView != null) {
      return pathname === "/dashboard" && currentDashView === dashboardView;
    }
    if (href === "/pricing") return pathname === "/pricing" || pathname.startsWith("/pricing/");
    if (href === "/explore") return pathname === "/explore" || pathname.startsWith("/explore/");
    if (href === "/settings") return pathname === "/settings" || pathname.startsWith("/settings/");
    return false;
  }

  return (
    <nav className="flex flex-1 flex-col gap-0.5 p-2">
      {links.map(({ href, label, icon: Icon, dashboardView }) => {
        const active = isActive(href, dashboardView);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/90 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="size-4 shrink-0 stroke-[1.5]" />
            {!collapsed && <span>{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarNavFallback({ collapsed }: { collapsed: boolean }) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 p-2">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/90 transition-all duration-200 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          title={collapsed ? label : undefined}
        >
          <Icon className="size-4 shrink-0 stroke-[1.5]" />
          {!collapsed && <span>{label}</span>}
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
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  const initials = (displayName || email || "U").slice(0, 2).toUpperCase();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex",
        collapsed ? "w-[72px]" : "w-56"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
        {!collapsed && <Logo href="/dashboard" className="text-sidebar-foreground [&_span:last-child]:text-sidebar-foreground" />}
        {collapsed && (
          <Link
            href="/dashboard"
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-yeo-600 text-sm font-bold text-primary-foreground"
          >
            Y
          </Link>
        )}
      </div>
      <Suspense fallback={<SidebarNavFallback collapsed={collapsed} />}>
        <SidebarNavLinks collapsed={collapsed} />
      </Suspense>
      {!collapsed && (
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center justify-between text-xs text-sidebar-foreground/80">
            <span>Credits</span>
            <span>{creditsDisplay(aiCredits, aiCreditsCeiling)}</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-sidebar-accent/50">
            <div
              className="h-1.5 rounded-full bg-yeo-600 transition-all"
              style={{ width: `${Math.max(0, Math.min(100, (aiCreditsCeiling > 0 ? (aiCredits / aiCreditsCeiling) * 100 : 0)))}%` }}
            />
          </div>
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ size: "sm" }),
              "mt-2 flex w-full justify-center rounded-xl bg-yeo-600 text-primary-foreground shadow-sm transition-all duration-200 hover:bg-yeo-700"
            )}
          >
            Get More Credits
          </Link>
        </div>
      )}
      <div className="border-t border-sidebar-border p-2">
        {!collapsed ? (
          <button
            type="button"
            className="mb-2 w-full rounded-lg border border-sidebar-border/70 bg-sidebar-accent/20 p-2 text-left transition-colors hover:bg-sidebar-accent/40"
            onClick={() => router.push("/settings")}
          >
            <div className="flex items-center gap-2">
              <Avatar className="size-8">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{displayName || "User"}</p>
                <p className="truncate text-xs text-sidebar-foreground/70">{email || "—"}</p>
              </div>
            </div>
          </button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent/60"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="size-4 stroke-[1.5]" /> : <PanelLeftClose className="size-4 stroke-[1.5]" />}
          {!collapsed && <span>Collapse sidebar</span>}
        </Button>
      </div>
    </aside>
  );
}
