"use client";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingHeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <GoogleSignInButton
        next="/dashboard"
        size="sm"
        variant="ghost"
        label="로그인"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-lg")}
      />
      <GoogleSignInButton
        next="/dashboard"
        size="sm"
        label="시작하기"
        className={cn(buttonVariants({ size: "sm" }), "rounded-lg bg-yeo-600 text-primary-foreground hover:bg-yeo-700")}
      />
    </div>
  );
}
