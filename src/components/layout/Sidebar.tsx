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
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/uiStore";

const links = [
  { href: "/dashboard", label: "모든 템플릿", icon: LayoutDashboard },
  { href: "/dashboard?view=my", label: "내 템플릿", icon: FileText },
  { href: "/dashboard?view=shared", label: "공유됨", icon: Users },
  { href: "/dashboard?view=favorites", label: "즐겨찾기", icon: Star },
  { href: "/dashboard?view=trash", label: "휴지통", icon: Trash2 },
  { href: "/explore", label: "탐색", icon: Sparkles },
  { href: "/settings", label: "설정", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-sidebar md:flex",
        collapsed ? "w-[72px]" : "w-56"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-3">
        {!collapsed && <Logo href="/dashboard" />}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-yeo-600 text-sm font-bold text-white">
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
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/80"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-2">
        <Button type="button" variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={toggleSidebar}>
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
          {!collapsed && <span>사이드바 접기</span>}
        </Button>
      </div>
    </aside>
  );
}
