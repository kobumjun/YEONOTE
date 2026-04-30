"use client";

import { useSearchParams } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  return (
    <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-md">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-surface-dark dark:text-white">로그인</h1>
        <p className="mt-1 text-sm text-muted-foreground">Google 계정으로 YEO에 로그인하거나 가입할 수 있습니다.</p>
      </div>
      <GoogleSignInButton next={next} className="w-full rounded-lg" size="lg" />
    </div>
  );
}
