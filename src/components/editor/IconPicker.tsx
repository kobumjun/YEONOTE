"use client";

import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const emojis = ["📄", "📅", "✅", "🎯", "💡", "🚀", "📚", "💼", "🏠", "❤️", "🧠", "📝", "🗂", "⭐", "🔥"];

export function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(buttonVariants({ variant: "outline", size: "icon" }), "rounded-lg text-xl")}
        aria-label="아이콘 선택"
      >
        {value || "📄"}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="grid grid-cols-5 gap-1">
          {emojis.map((e) => (
            <button
              key={e}
              type="button"
              className="flex h-9 items-center justify-center rounded-md text-lg hover:bg-muted"
              onClick={() => onChange(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
