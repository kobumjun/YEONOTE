"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function onOAuth(provider: "google" | "github") {
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${origin}/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) toast.error(error.message);
  }

  async function onMagicLink() {
    if (!email) {
      toast.error("이메일을 입력하세요.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(next)}` },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("로그인 링크를 이메일로 보냈습니다.");
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-md">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-surface-dark dark:text-white">로그인</h1>
        <p className="mt-1 text-sm text-muted-foreground">이메일 또는 소셜 계정으로 계속하세요.</p>
      </div>
      <form onSubmit={onEmailLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">비밀번호</Label>
            <Link href="/forgot-password" className="text-xs text-yeo-600 hover:underline">
              비밀번호 찾기
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg"
          />
        </div>
        <Button type="submit" className="w-full rounded-lg bg-yeo-600 hover:bg-yeo-700" disabled={loading}>
          {loading ? "처리 중…" : "로그인"}
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">또는</span>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="outline" className="rounded-lg" onClick={() => onOAuth("google")}>
          Google
        </Button>
        <Button type="button" variant="outline" className="rounded-lg" onClick={() => onOAuth("github")}>
          GitHub
        </Button>
      </div>
      <Button type="button" variant="secondary" className="w-full rounded-lg" onClick={onMagicLink} disabled={loading}>
        매직 링크로 로그인
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        계정이 없나요?{" "}
        <Link href="/signup" className="font-medium text-yeo-600 hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
