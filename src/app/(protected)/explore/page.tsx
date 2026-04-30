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
      toast.error(j.error ?? "Something went wrong");
      return;
    }
    toast.success("Duplicated to your workspace.");
    window.location.href = `/template/${j.template.id}`;
  }

  async function like(id: string) {
    const res = await fetch(`/api/templates/${id}/like`, { method: "POST" });
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error ?? "Could not update like");
      return;
    }
    if (typeof j.likes_count === "number") {
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, likes_count: j.likes_count } : t)));
      toast.success(j.liked ? "Liked." : "Like removed.");
    }
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground">Explore</h1>
      <p className="text-sm text-muted-foreground">Browse public templates and duplicate them to your dashboard.</p>
      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl border border-border" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <Card key={t.id} className="rounded-xl border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">{t.icon}</span>
                  <div>
                    <Link href={`/shared/${t.id}`} className="font-medium text-foreground transition-colors duration-200 hover:text-yeo-600">
                      {t.title}
                    </Link>
                    {t.category && <p className="text-xs text-muted-foreground">{t.category}</p>}
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Avatar size="sm">
                        {t.creator?.avatar_url ? <AvatarImage src={t.creator.avatar_url} alt="" /> : null}
                        <AvatarFallback>{(t.creator?.full_name?.[0] ?? "U").toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{t.creator?.full_name ?? "Anonymous"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="size-3 stroke-[1.5]" /> {t.likes_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Copy className="size-3 stroke-[1.5]" /> {t.duplicates_count}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="rounded-xl shadow-sm" onClick={() => duplicate(t.id)}>
                    Use template
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl border-border" onClick={() => like(t.id)}>
                    Like
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
