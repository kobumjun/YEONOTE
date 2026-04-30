"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/callback?next=/settings/profile`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      setSent(true);
      toast.success("재설정 링크를 보냈습니다.");
    }
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-md">
      <h1 className="font-heading text-2xl font-semibold text-surface-dark dark:text-white">비밀번호 재설정</h1>
      {sent ? (
        <p className="text-sm text-muted-foreground">이메일을 확인하고 링크를 눌러 주세요.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-lg bg-yeo-600">
            {loading ? "전송 중…" : "재설정 링크 보내기"}
          </Button>
        </form>
      )}
      <Link href="/login" className="block text-center text-sm text-yeo-600 hover:underline">
        로그인으로 돌아가기
      </Link>
    </div>
  );
}
