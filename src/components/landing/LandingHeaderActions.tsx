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
        label="Sign In"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "rounded-2xl text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      />
      <GoogleSignInButton
        next="/dashboard"
        size="sm"
        label="Get Started"
        className={cn(buttonVariants({ size: "sm" }), "yeo-gradient-btn rounded-2xl px-4 font-semibold shadow-sm")}
      />
    </div>
  );
}
