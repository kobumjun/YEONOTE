"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { useUiStore } from "@/stores/uiStore";
import type { TemplateRow } from "@/types/database";

export function DashboardClient() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "all";
  const q = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "recent";
  const setGenerateOpen = useUiStore((s) => s.setGenerateOpen);

  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("view", view === "all" ? "all" : view);
    if (q) params.set("q", q);
    params.set("sort", sort === "alphabetical" ? "alphabetical" : "recent");
    const res = await fetch(`/api/templates?${params.toString()}`);
    const j = await res.json();
    if (res.ok) setTemplates(j.templates ?? []);
    setLoading(false);
  }, [view, q, sort]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-surface-dark dark:text-white">템플릿</h1>
          <p className="text-sm text-muted-foreground">생성 · 정렬 · 필터</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={layout} onValueChange={(v) => setLayout(v as "grid" | "list")}>
            <TabsList className="rounded-lg">
              <TabsTrigger value="grid" className="rounded-md">
                <LayoutGrid className="size-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="rounded-md">
                <List className="size-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button className="rounded-lg bg-yeo-600" onClick={() => setGenerateOpen(true)}>
            <Plus className="mr-1 size-4" />
            새로 만들기
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="mt-16 rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <p className="text-muted-foreground">템플릿이 없습니다. AI로 첫 템플릿을 만들어 보세요.</p>
          <Button className="mt-4 rounded-lg bg-yeo-600" onClick={() => setGenerateOpen(true)}>
            생성하기
          </Button>
        </div>
      ) : (
        <div
          className={
            layout === "grid" ? "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "mt-8 flex flex-col gap-3"
          }
        >
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}
    </div>
  );
}
