"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

function safeNext(next: string | null): string {
  const n = next?.trim() || "/dashboard";
  if (!n.startsWith("/") || n.startsWith("//")) return "/dashboard";
  return n;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => safeNext(searchParams.get("next")), [searchParams]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    function goDashboard() {
      router.replace(next);
    }

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        goDashboard();
        return;
      }
      setChecking(false);
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
        goDashboard();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [next, router]);

  if (checking) {
    return (
      <div className="flex w-full max-w-md min-h-[200px] items-center justify-center rounded-xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

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
