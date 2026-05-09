"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplateListPagination } from "@/components/templates/TemplateListPagination";
import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";
import { withAuth } from "@/lib/auth-fetch";
import type { TemplateRow } from "@/types/database";

const PAGE_SIZE = 12;

export function CreationsListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "all";
  const q = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "recent";
  const filter = searchParams.get("filter") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const requestPromptFocus = useUiStore((s) => s.requestPromptFocus);

  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("view", view === "all" ? "all" : view);
    if (q) params.set("q", q);
    params.set("sort", sort === "alphabetical" ? "alphabetical" : "recent");
    if (view === "my" && filter === "shared_with_me") params.set("filter", "shared_with_me");
    if (page > 1) params.set("page", String(page));
    const res = await fetch(`/api/templates?${params.toString()}`, await withAuth());
    const j = await res.json();
    if (res.ok) {
      setTemplates(j.templates ?? []);
      setTotal(typeof j.total === "number" ? j.total : (j.templates?.length ?? 0));
    }
    setLoading(false);
  }, [view, q, sort, filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  function goCreate() {
    requestPromptFocus();
    router.push("/dashboard");
  }

  const isTrash = view === "trash";
  const showSharedFilter = view === "my";

  return (
    <div className="px-4 py-8 md:px-10 md:py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">All Creations</h1>
          <p className="max-w-xl text-sm text-muted-foreground md:text-base">
            Create and manage your documents, presentations, images, and templates.
          </p>
          {showSharedFilter && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/dashboard/creations?view=my"
                className={cn(
                  buttonVariants({ size: "sm", variant: filter !== "shared_with_me" ? "secondary" : "ghost" }),
                  "rounded-2xl shadow-sm",
                  filter === "shared_with_me" && "border border-border"
                )}
              >
                My Work
              </Link>
              <Link
                href="/dashboard/creations?view=my&filter=shared_with_me"
                className={cn(
                  buttonVariants({ size: "sm", variant: filter === "shared_with_me" ? "secondary" : "ghost" }),
                  "rounded-2xl shadow-sm",
                  filter !== "shared_with_me" && "border border-border"
                )}
              >
                Shared with me
              </Link>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={layout} onValueChange={(v) => setLayout(v as "grid" | "list")}>
            <TabsList className="rounded-2xl border border-border/80 bg-card/60 p-1 shadow-sm">
              <TabsTrigger value="grid" className="rounded-xl data-[state=active]:bg-muted data-[state=active]:shadow-sm">
                <LayoutGrid className="size-[18px] stroke-[1.5]" />
              </TabsTrigger>
              <TabsTrigger value="list" className="rounded-xl data-[state=active]:bg-muted data-[state=active]:shadow-sm">
                <List className="size-[18px] stroke-[1.5]" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button className="yeo-gradient-btn h-10 gap-2 rounded-2xl px-5 text-sm font-semibold shadow-sm" onClick={goCreate}>
            <Plus className="size-[18px] stroke-[1.75]" />
            Create new
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl border border-border/60" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-border/80 bg-card/50 p-12 text-center backdrop-blur-sm">
          <p className="text-muted-foreground">
            {filter === "shared_with_me"
              ? "No templates have been shared with you yet. They will appear here once someone shares one."
              : isTrash
                ? "Trash is empty."
                : "No creations yet. Start from Home with a prompt."}
          </p>
          {!isTrash && filter !== "shared_with_me" && (
            <Button className="yeo-gradient-btn mt-6 rounded-2xl px-8 py-2.5 font-semibold shadow-sm" onClick={goCreate}>
              Create
            </Button>
          )}
        </div>
      ) : (
        <>
          <div
            className={
              layout === "grid" ? "mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "mt-10 flex flex-col gap-4"
            }
          >
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                layout={layout}
                variant={isTrash ? "trash" : "default"}
                onMutate={load}
              />
            ))}
          </div>
          <TemplateListPagination total={total} pageSize={PAGE_SIZE} />
        </>
      )}
    </div>
  );
}
