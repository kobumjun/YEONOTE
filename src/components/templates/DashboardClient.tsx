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
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground">Create, sort, and filter your workspace.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={layout} onValueChange={(v) => setLayout(v as "grid" | "list")}>
            <TabsList className="rounded-xl border border-border bg-muted/40">
              <TabsTrigger value="grid" className="rounded-lg data-[state=active]:shadow-sm">
                <LayoutGrid className="size-4 stroke-[1.5]" />
              </TabsTrigger>
              <TabsTrigger value="list" className="rounded-lg data-[state=active]:shadow-sm">
                <List className="size-4 stroke-[1.5]" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button className="rounded-xl bg-yeo-600 shadow-sm transition-all duration-200 hover:bg-yeo-700" onClick={() => setGenerateOpen(true)}>
            <Plus className="mr-1 size-4 stroke-[1.5]" />
            New
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl border border-border" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="mt-16 rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <p className="text-muted-foreground">No templates yet. Create your first one with AI or start blank.</p>
          <Button className="mt-4 rounded-xl bg-yeo-600 shadow-sm" onClick={() => setGenerateOpen(true)}>
            Create
          </Button>
        </div>
      ) : (
        <div className={layout === "grid" ? "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "mt-8 flex flex-col gap-3"}>
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}
    </div>
  );
}
