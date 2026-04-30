"use client";

import { useRouter } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useUiStore } from "@/stores/uiStore";
import { creditsDisplay } from "@/lib/credits";

export type TopBarProfile = {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  aiCredits: number;
  aiCreditsCeiling: number;
};

function initials(name: string, email: string): string {
  const n = name.trim();
  if (n.length >= 2) return n.slice(0, 2).toUpperCase();
  const e = email.trim();
  if (e.length >= 2) return e.slice(0, 2).toUpperCase();
  return "Y";
}

export function TopBar({ profile }: { profile: TopBarProfile }) {
  const router = useRouter();
  const setGenerateOpen = useUiStore((s) => s.setGenerateOpen);
  const { displayName, email, avatarUrl, aiCredits, aiCreditsCeiling } = profile;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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
        <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full shrink-0")}
          aria-label="계정 메뉴"
        >
          <Avatar className="size-8">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="object-cover" /> : null}
            <AvatarFallback>{initials(displayName, email)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="space-y-0.5">
            <p className="truncate font-medium text-foreground">{displayName || "사용자"}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">{email || "—"}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/settings")}>설정</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
