"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      toast.success("확인 이메일을 발송했습니다. 메일함을 확인하세요.");
    }
  }

  async function onOAuth(provider: "google" | "github") {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/callback?next=/dashboard` },
    });
    if (error) toast.error(error.message);
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-md">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-surface-dark dark:text-white">회원가입</h1>
        <p className="mt-1 text-sm text-muted-foreground">YEO에서 템플릿을 만들어 보세요.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">이름</Label>
          <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-lg" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg"
          />
        </div>
        <Button type="submit" className="w-full rounded-lg bg-yeo-600 hover:bg-yeo-700" disabled={loading}>
          {loading ? "처리 중…" : "가입하기"}
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
      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-medium text-yeo-600 hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
