"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function TemplateListPagination({
  total,
  pageSize,
  noun = "templates",
  className,
}: {
  total: number;
  pageSize: number;
  noun?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  function hrefFor(next: number) {
    const q = new URLSearchParams(searchParams.toString());
    if (next <= 1) q.delete("page");
    else q.set("page", String(next));
    const qs = q.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  if (total === 0) return null;

  return (
    <div className={cn("mt-8 flex flex-col items-center gap-3", className)}>
      <p className="text-center text-sm text-muted-foreground">
        Showing {from}-{to} of {total} {noun}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        {safePage > 1 ? (
          <Link
            href={hrefFor(safePage - 1)}
            className="text-foreground underline-offset-4 transition-colors hover:text-yeo-600 hover:underline"
          >
            ← Previous
          </Link>
        ) : (
          <span className="pointer-events-none text-muted-foreground/50">← Previous</span>
        )}
        <span className="text-muted-foreground">|</span>
        <span className="tabular-nums text-foreground">
          Page {safePage} of {totalPages}
        </span>
        <span className="text-muted-foreground">|</span>
        {safePage < totalPages ? (
          <Link
            href={hrefFor(safePage + 1)}
            className="text-foreground underline-offset-4 transition-colors hover:text-yeo-600 hover:underline"
          >
            Next →
          </Link>
        ) : (
          <span className="pointer-events-none text-muted-foreground/50">Next →</span>
        )}
      </div>
    </div>
  );
}
