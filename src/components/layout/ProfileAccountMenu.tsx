"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { TopBarProfile } from "@/types/top-bar-profile";

function initials(name: string, email: string): string {
  const n = (name ?? "").trim();
  if (n.length >= 2) return n.slice(0, 2).toUpperCase();
  const e = (email ?? "").trim();
  if (e.length >= 2) return e.slice(0, 2).toUpperCase();
  return "Y";
}

type BoundaryState = { hasError: boolean };

class ProfileMenuErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  BoundaryState
> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function ProfileAvatarTrigger({
  displayName,
  email,
  avatarUrl,
}: Pick<TopBarProfile, "displayName" | "email" | "avatarUrl">) {
  const [imageBroken, setImageBroken] = useState(false);
  const safeSrc = avatarUrl && !imageBroken ? avatarUrl : null;

  return (
    <DropdownMenuTrigger
      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full shrink-0")}
      aria-label="계정 메뉴"
    >
      <Avatar className="size-8">
        {safeSrc ? (
          <AvatarImage
            src={safeSrc}
            alt=""
            className="object-cover"
            onLoadingStatusChange={(status) => {
              if (status === "error") setImageBroken(true);
            }}
          />
        ) : null}
        <AvatarFallback delay={safeSrc ? 200 : 0}>{initials(displayName ?? "", email ?? "")}</AvatarFallback>
      </Avatar>
    </DropdownMenuTrigger>
  );
}

function ProfileDropdownInner({ profile }: { profile: TopBarProfile }) {
  const router = useRouter();
  const displayName = profile?.displayName ?? "";
  const email = profile?.email ?? "";

  async function signOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      /* still navigate */
    }
    try {
      router.push("/login");
      router.refresh();
    } catch {
      window.location.href = "/login";
    }
  }

  return (
    <DropdownMenu>
      <ProfileAvatarTrigger displayName={displayName} email={email} avatarUrl={profile?.avatarUrl ?? null} />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-0.5">
          <p className="truncate font-medium text-foreground">{displayName || "사용자"}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{email || "—"}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>설정</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onClick={() => void signOut()}
        >
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProfileAccountMenu({ profile }: { profile: TopBarProfile }) {
  const safeProfile: TopBarProfile = {
    displayName: profile?.displayName ?? "",
    email: profile?.email ?? "",
    avatarUrl: profile?.avatarUrl ?? null,
    aiCredits: typeof profile?.aiCredits === "number" && !Number.isNaN(profile.aiCredits) ? profile.aiCredits : 0,
    aiCreditsCeiling:
      typeof profile?.aiCreditsCeiling === "number" && !Number.isNaN(profile.aiCreditsCeiling)
        ? profile.aiCreditsCeiling
        : 0,
  };

  const fallback = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="rounded-full shrink-0"
      aria-label="계정 메뉴 (간단 모드)"
      title="메뉴를 불러오지 못했습니다. 다시 로드해 주세요."
    >
      <Avatar className="size-8">
        <AvatarFallback>{initials(safeProfile.displayName, safeProfile.email)}</AvatarFallback>
      </Avatar>
    </Button>
  );

  return (
    <ProfileMenuErrorBoundary fallback={fallback}>
      <ProfileDropdownInner profile={safeProfile} />
    </ProfileMenuErrorBoundary>
  );
}
