"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Copy } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type PublicTpl = {
  id: string;
  title: string;
  icon: string;
  category: string | null;
  likes_count: number;
  duplicates_count: number;
  creator?: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

export default function ExplorePage() {
  const [items, setItems] = useState<PublicTpl[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/explore")
      .then((r) => r.json())
      .then((j) => setItems(j.templates ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function duplicate(id: string) {
    const res = await fetch(`/api/templates/${id}/duplicate`, { method: "POST" });
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error ?? "실패");
      return;
    }
    toast.success("내 템플릿에 복제했습니다.");
    window.location.href = `/template/${j.template.id}`;
  }

  async function like(id: string) {
    const res = await fetch(`/api/templates/${id}/like`, { method: "POST" });
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error ?? "좋아요 처리 실패");
      return;
    }
    if (typeof j.likes_count === "number") {
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, likes_count: j.likes_count } : t)));
      toast.success(j.liked ? "좋아요를 눌렀습니다." : "좋아요를 취소했습니다.");
    }
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-heading text-2xl font-semibold text-surface-dark dark:text-white">탐색</h1>
      <p className="text-sm text-muted-foreground">공개 템플릿을 찾아 복제하세요.</p>
      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <Card key={t.id} className="rounded-xl border shadow-sm">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">{t.icon}</span>
                  <div>
                    <Link href={`/shared/${t.id}`} className="font-medium hover:underline">
                      {t.title}
                    </Link>
                    {t.category && <p className="text-xs text-muted-foreground">{t.category}</p>}
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Avatar size="sm">
                        {t.creator?.avatar_url ? <AvatarImage src={t.creator.avatar_url} alt="" /> : null}
                        <AvatarFallback>{(t.creator?.full_name?.[0] ?? "U").toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{t.creator?.full_name ?? "익명 사용자"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="size-3" /> {t.likes_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Copy className="size-3" /> {t.duplicates_count}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="rounded-lg" onClick={() => duplicate(t.id)}>
                    사용하기
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={() => like(t.id)}>
                    좋아요
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
