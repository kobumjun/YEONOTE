"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const presets = [
  { id: "gradient-blue", class: "from-sky-400 to-blue-700" },
  { id: "gradient-indigo", class: "from-indigo-400 to-violet-800" },
  { id: "gradient-rose", class: "from-rose-300 to-pink-700" },
  { id: "gradient-yeo", class: "from-yeo-400 to-yeo-800" },
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
      <PopoverTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg")}>
        커버
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <p className="mb-2 text-xs font-medium text-muted-foreground">그라데이션</p>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={cn(
                "h-12 rounded-md bg-gradient-to-br ring-2 ring-offset-2 transition-all",
                p.class,
                value === p.id ? "ring-yeo-600" : "ring-transparent hover:ring-yeo-300"
              )}
              onClick={() => onChange(p.id)}
              aria-label={p.id}
            />
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" className="mt-3 w-full" onClick={() => onChange(null)}>
          커버 제거
        </Button>
      </PopoverContent>
    </Popover>
  );
}
