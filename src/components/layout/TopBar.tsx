"use client";

import { useRouter } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/uiStore";
import { creditsDisplay } from "@/lib/credits";
import { ProfileAccountMenu } from "@/components/layout/ProfileAccountMenu";
import type { TopBarProfile } from "@/types/top-bar-profile";

export type { TopBarProfile } from "@/types/top-bar-profile";

export function TopBar({ profile }: { profile: TopBarProfile }) {
  const router = useRouter();
  const setGenerateOpen = useUiStore((s) => s.setGenerateOpen);
  const aiCredits = typeof profile?.aiCredits === "number" && !Number.isNaN(profile.aiCredits) ? profile.aiCredits : 0;
  const aiCreditsCeiling =
    typeof profile?.aiCreditsCeiling === "number" && !Number.isNaN(profile.aiCreditsCeiling) ? profile.aiCreditsCeiling : 0;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground stroke-[1.5]" />
        <Input
          placeholder="Search templates…"
          className="rounded-xl border-border pl-9 transition-all duration-200"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = (e.target as HTMLInputElement).value;
              router.push(`/dashboard?q=${encodeURIComponent(v)}`);
            }
          }}
        />
      </div>
      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2">
        <div
          className="max-w-[160px] truncate rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground"
          title="Remaining AI credits"
        >
          Credits {creditsDisplay(aiCredits, aiCreditsCeiling)}
        </div>
        <Button
          type="button"
          size="sm"
          className="hidden rounded-xl bg-yeo-600 shadow-sm transition-all duration-200 hover:bg-yeo-700 md:inline-flex"
          onClick={() => setGenerateOpen(true)}
        >
          New Template
        </Button>
        <Button type="button" variant="ghost" size="icon" className="rounded-xl" aria-label="Notifications">
          <Bell className="size-4 stroke-[1.5]" />
        </Button>
        <ProfileAccountMenu profile={profile} />
      </div>
    </header>
  );
}
