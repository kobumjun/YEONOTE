"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const presets = [
  { id: "gradient-blue", class: "from-slate-200 to-slate-500 dark:from-slate-700 dark:to-slate-900" },
  { id: "gradient-indigo", class: "from-violet-200 to-violet-700 dark:from-violet-900 dark:to-violet-950" },
  { id: "gradient-rose", class: "from-rose-200 to-rose-600 dark:from-rose-900 dark:to-rose-950" },
  { id: "gradient-yeo", class: "from-yeo-200 to-yeo-800 dark:from-yeo-900 dark:to-yeo-950" },
];

export function CoverPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (cover: string | null) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl border-border shadow-sm")}>
        Cover
      </PopoverTrigger>
      <PopoverContent className="w-64 rounded-xl border-border p-3" align="start">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Gradients</p>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={cn(
                "h-12 rounded-lg bg-gradient-to-br ring-2 ring-offset-2 transition-all duration-200",
                p.class,
                value === p.id ? "ring-yeo-600" : "ring-transparent hover:ring-yeo-300"
              )}
              onClick={() => onChange(p.id)}
              aria-label={p.id}
            />
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" className="mt-3 w-full rounded-xl" onClick={() => onChange(null)}>
          Remove cover
        </Button>
      </PopoverContent>
    </Popover>
  );
}
