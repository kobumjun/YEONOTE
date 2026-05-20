"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LayoutGrid, CreditCard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { planLabel, type UserPlan } from "@/lib/subscription";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV_LINKS = [
  { href: "/dashboard", label: "Decks", icon: LayoutGrid, key: "dashboard" as const },
  { href: "/pricing", label: "Pricing", icon: CreditCard, key: "pricing" as const },
  { href: "/settings", label: "Settings", icon: Settings, key: "settings" as const },
];

function navActive(key: (typeof NAV_LINKS)[number]["key"], pathname: string): boolean {
  if (key === "dashboard") return pathname === "/dashboard" || pathname.startsWith("/deck/");
  if (key === "pricing") return pathname === "/pricing" || pathname.startsWith("/pricing/");
  if (key === "settings") return pathname === "/settings" || pathname.startsWith("/settings/");
  return false;
}

export function Sidebar({
  plan,
  displayName,
  email,
  avatarUrl,
}: {
  plan: UserPlan;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const initials = (displayName || email || "U").slice(0, 2).toUpperCase();

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
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#6C5CE7] text-sm font-bold text-white shadow-sm"
          aria-label="YEO Home"
        >
          Y
        </Link>
        <span className="min-w-0 truncate text-sm font-semibold tracking-tight opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
          YEO
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
        {NAV_LINKS.map(({ href, label, icon: Icon, key }) => {
          const active = navActive(key, pathname);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                active
                  ? "bg-[#6C5CE7]/12 text-[#6C5CE7]"
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

      <div className="mt-auto space-y-3 border-t border-sidebar-border p-3">
        <div className="flex justify-center group-hover/sidebar:hidden">
          <span className="rounded-full bg-[#6C5CE7]/10 px-2 py-1 text-[10px] font-semibold text-[#6C5CE7]">
            {planLabel(plan)}
          </span>
        </div>
        <div className="hidden group-hover/sidebar:block">
          <p className="text-center text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{planLabel(plan)}</span> plan
          </p>
          {plan === "free" && (
            <Link
              href="/pricing"
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#6C5CE7] py-2.5 text-center text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#5A4BD1]"
            >
              Upgrade
            </Link>
          )}
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
