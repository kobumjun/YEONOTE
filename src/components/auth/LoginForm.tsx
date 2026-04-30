"use client";

import { useSearchParams } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  return (
    <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground">Sign In</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use Google to sign in or create your YEO account.</p>
      </div>
      <GoogleSignInButton next={next} className="w-full rounded-xl shadow-sm" size="lg" />
    </div>
  );
}
