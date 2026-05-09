"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/uiStore";
import { ProfileAccountMenu } from "@/components/layout/ProfileAccountMenu";
import type { TopBarProfile } from "@/types/top-bar-profile";

export type { TopBarProfile } from "@/types/top-bar-profile";

export function TopBar({ profile }: { profile: TopBarProfile }) {
  const router = useRouter();
  const pathname = usePathname();
  const requestPromptFocus = useUiStore((s) => s.requestPromptFocus);
  const aiCredits = typeof profile?.aiCredits === "number" && !Number.isNaN(profile.aiCredits) ? profile.aiCredits : 0;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/80 bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="relative hidden min-w-0 max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground stroke-[1.5]" />
        <Input
          placeholder="Search creations…"
          className="h-10 rounded-2xl border-border/80 bg-card/60 pl-10 text-sm shadow-sm transition-shadow focus-visible:ring-violet-500/25"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = (e.target as HTMLInputElement).value;
              router.push(`/dashboard/creations?q=${encodeURIComponent(v)}`);
            }
          }}
        />
      </div>
      <div className="hidden flex-1 md:block" aria-hidden />

      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">{aiCredits} credits</span>
        <Button
          type="button"
          size="sm"
          className="yeo-gradient-btn hidden h-9 rounded-xl px-4 text-sm font-semibold md:inline-flex"
          onClick={() => {
            if (pathname === "/dashboard") {
              requestPromptFocus();
            } else {
              router.push("/dashboard?focus=1");
            }
          }}
        >
          Create new
        </Button>
        <ProfileAccountMenu profile={profile} />
      </div>
    </header>
  );
}
