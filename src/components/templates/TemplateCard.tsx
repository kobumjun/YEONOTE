"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { TemplateRow } from "@/types/database";

export function TemplateCard({
  template,
  layout = "grid",
  variant = "default",
  onMutate,
}: {
  template: TemplateRow;
  layout?: "grid" | "list";
  variant?: "default" | "trash";
  onMutate?: () => void;
}) {
  const router = useRouter();
  const href = `/template/${template.id}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmTrashOpen, setConfirmTrashOpen] = useState(false);
  const [confirmPermanentOpen, setConfirmPermanentOpen] = useState(false);

  async function softDelete() {
    const res = await fetch(`/api/templates/${template.id}`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((j as { error?: string }).error ?? "삭제하지 못했어요");
      return;
    }
    toast.success("휴지통으로 옮겼어요.");
    setConfirmTrashOpen(false);
    onMutate?.();
    router.refresh();
  }

  async function restore() {
    const res = await fetch(`/api/templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_deleted: false }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((j as { error?: string }).error ?? "복원하지 못했어요");
      return;
    }
    toast.success("복원했어요.");
    onMutate?.();
    router.refresh();
  }

  async function permanentDelete() {
    const res = await fetch(`/api/templates/${template.id}?permanent=1`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((j as { error?: string }).error ?? "영구 삭제하지 못했어요");
      return;
    }
    toast.success("영구 삭제했어요.");
    setConfirmPermanentOpen(false);
    onMutate?.();
    router.refresh();
  }

  if (variant === "trash") {
    return (
      <>
        <Card className="h-full rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md">
          <CardContent className={cn("p-4", layout === "list" && "sm:flex sm:items-center sm:justify-between sm:gap-4")}>
            <Link href={href} className="flex min-w-0 gap-3 sm:flex-1 sm:items-center">
              <span className="text-2xl">{template.icon}</span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium tracking-[-0.01em] text-foreground">{template.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  삭제일{" "}
                  {template.deleted_at ? format(new Date(template.deleted_at), "yyyy.MM.dd HH:mm") : "—"}
                </p>
              </div>
            </Link>
            <div className={cn("mt-3 flex flex-wrap gap-2", layout === "list" && "sm:mt-0 sm:shrink-0")}>
              <Button type="button" size="sm" variant="secondary" className="rounded-xl shadow-sm" onClick={() => void restore()}>
                복원
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="rounded-xl"
                onClick={() => setConfirmPermanentOpen(true)}
              >
                영구 삭제
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={confirmPermanentOpen} onOpenChange={setConfirmPermanentOpen}>
          <DialogContent className="rounded-xl">
            <DialogHeader>
              <DialogTitle>영구 삭제할까요?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">되돌릴 수 없어요. 계정에서 이 템플릿이 완전히 사라져요.</p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setConfirmPermanentOpen(false)}>
                취소
              </Button>
              <Button type="button" variant="destructive" className="rounded-xl" onClick={() => void permanentDelete()}>
                영구 삭제
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Card className="group relative h-full rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger
            type="button"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "absolute right-2 top-2 z-10 size-8 rounded-lg text-muted-foreground opacity-70 hover:bg-muted hover:text-foreground hover:opacity-100"
            )}
            aria-label="템플릿 작업"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4 stroke-[1.5]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-xl border-border">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                setMenuOpen(false);
                setConfirmTrashOpen(true);
              }}
            >
              <Trash2 className="mr-2 size-4 stroke-[1.5]" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link href={href} className="block">
          <CardContent className={cn("p-4 pr-11", layout === "list" && "flex flex-row items-start gap-3 sm:items-center")}>
            <span className="text-2xl">{template.icon}</span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium tracking-[-0.01em] text-foreground">{template.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                수정일 {format(new Date(template.updated_at), "yyyy.MM.dd HH:mm")}
              </p>
              {template.tags && template.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px]">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Link>
      </Card>

      <Dialog open={confirmTrashOpen} onOpenChange={setConfirmTrashOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>휴지통으로 옮길까요?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">나중에 휴지통에서 다시 복원할 수 있어요.</p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setConfirmTrashOpen(false)}>
              취소
            </Button>
            <Button type="button" className="rounded-xl bg-yeo-600 shadow-sm hover:bg-yeo-700" onClick={() => void softDelete()}>
              휴지통으로 이동
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
