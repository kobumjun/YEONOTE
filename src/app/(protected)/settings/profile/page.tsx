"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Link from "next/link";

export default function ProfileSettingsPage() {
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [langKo, setLangKo] = useState(true);
  const [theme, setTheme] = useState("system");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("full_name,bio,language,theme")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setFullName(data.full_name ?? "");
            setBio(data.bio ?? "");
            setLangKo((data.language ?? "ko") === "ko");
            setTheme(data.theme ?? "system");
          }
          setLoading(false);
        });
    });
  }, []);

  async function save() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        bio,
        language: langKo ? "ko" : "en",
        theme,
      })
      .eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("저장했습니다.");
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">로딩…</div>;

  return (
    <div className="mx-auto max-w-lg p-4 md:p-8">
      <Link href="/settings" className="text-sm text-yeo-600 hover:underline">
        ← 설정
      </Link>
      <h1 className="mt-4 font-heading text-2xl font-semibold">프로필</h1>
      <div className="mt-6 space-y-4">
        <div>
          <Label>이름</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-2 rounded-lg" />
        </div>
        <div>
          <Label>소개</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-2 rounded-lg" rows={4} />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">언어</p>
            <p className="text-xs text-muted-foreground">한국어 / English</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>EN</span>
            <Switch checked={langKo} onCheckedChange={setLangKo} />
            <span>KO</span>
          </div>
        </div>
        <div>
          <Label>테마</Label>
          <select
            className="mt-2 flex h-10 w-full rounded-lg border bg-background px-3 text-sm"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="system">시스템</option>
            <option value="light">라이트</option>
            <option value="dark">다크</option>
          </select>
        </div>
        <Button className="rounded-lg bg-yeo-600" onClick={save}>
          저장
        </Button>
      </div>
    </div>
  );
}
