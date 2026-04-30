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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="템플릿 검색…"
          className="rounded-lg pl-9"
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
          className="max-w-[140px] truncate rounded-full border bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground"
          title="남은 AI 크레딧"
        >
          크레딧 {creditsDisplay(aiCredits, aiCreditsCeiling)}
        </div>
        <Button type="button" size="sm" className="hidden rounded-lg bg-yeo-600 md:inline-flex" onClick={() => setGenerateOpen(true)}>
          새 템플릿
        </Button>
        <Button type="button" variant="ghost" size="icon" className="rounded-lg" aria-label="알림">
          <Bell className="size-4" />
        </Button>
        <ProfileAccountMenu profile={profile} />
      </div>
    </header>
  );
}
