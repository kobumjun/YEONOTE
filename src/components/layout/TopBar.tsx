"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProfileAccountMenu } from "@/components/layout/ProfileAccountMenu";
import { planLabel } from "@/lib/subscription";
import type { TopBarProfile } from "@/types/top-bar-profile";

export type { TopBarProfile } from "@/types/top-bar-profile";

export function TopBar({ profile }: { profile: TopBarProfile }) {
  const router = useRouter();
  const pathname = usePathname();
  const onDashboard = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/80 bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {!onDashboard && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => router.push("/dashboard")}
          >
            ← Decks
          </Button>
        )}
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {planLabel(profile.plan)} plan
        </span>
        {onDashboard && (
          <Button
            type="button"
            size="sm"
            className="hidden h-9 rounded-xl bg-[#6C5CE7] px-4 text-sm font-semibold text-white hover:bg-[#5A4BD1] md:inline-flex"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("yeo:new-deck"));
            }}
          >
            New Deck
          </Button>
        )}
        <ProfileAccountMenu profile={profile} />
      </div>
    </header>
  );
}
