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
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-xl text-muted-foreground hover:text-foreground")}
      />
      <GoogleSignInButton
        next="/dashboard"
        size="sm"
        label="Get Started"
        className={cn(
          buttonVariants({ size: "sm" }),
          "rounded-xl bg-yeo-600 text-primary-foreground shadow-sm transition-all duration-200 hover:bg-yeo-700"
        )}
      />
    </div>
  );
}
