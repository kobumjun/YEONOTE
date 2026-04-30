import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-1.5 font-heading font-semibold tracking-tight", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yeo-600 text-lg font-bold text-white shadow-sm">
        Y
      </span>
      <span className="text-xl text-surface-dark dark:text-white">YEO</span>
    </Link>
  );
}
