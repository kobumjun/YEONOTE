"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Star,
  Trash2,
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

const links = [
  { href: "/dashboard", label: "All Templates", icon: LayoutDashboard },
  { href: "/dashboard?view=my", label: "My Templates", icon: FileText },
  { href: "/dashboard?view=shared", label: "Shared", icon: Users },
  { href: "/dashboard?view=favorites", label: "Favorites", icon: Star },
  { href: "/dashboard?view=trash", label: "Trash", icon: Trash2 },
  { href: "/explore", label: "Explore", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  aiCredits,
  aiCreditsCeiling,
}: {
  aiCredits: number;
  aiCreditsCeiling: number;
}) {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

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
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
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
      {!collapsed && (
        <div className="border-t border-sidebar-border p-3">
          <p className="text-xs font-medium text-sidebar-foreground/80">
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
      )}
      <div className="border-t border-sidebar-border p-2">
        <Button type="button" variant="ghost" size="sm" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent/60" onClick={toggleSidebar}>
          {collapsed ? <PanelLeft className="size-4 stroke-[1.5]" /> : <PanelLeftClose className="size-4 stroke-[1.5]" />}
          {!collapsed && <span>Collapse sidebar</span>}
        </Button>
      </div>
    </aside>
  );
}
