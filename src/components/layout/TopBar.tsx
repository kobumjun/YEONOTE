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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useUiStore } from "@/stores/uiStore";

export function TopBar({ email }: { email: string }) {
  const router = useRouter();
  const setGenerateOpen = useUiStore((s) => s.setGenerateOpen);

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
      <Button type="button" size="sm" className="ml-auto hidden rounded-lg bg-yeo-600 md:inline-flex" onClick={() => setGenerateOpen(true)}>
        새 템플릿
      </Button>
      <Button type="button" variant="ghost" size="icon" className="rounded-lg" aria-label="알림">
        <Bell className="size-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full")}
          aria-label="계정 메뉴"
        >
          <Avatar className="size-8">
            <AvatarFallback>{email.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/settings/profile")}>프로필</DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings/billing")}>결제</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>로그아웃</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
