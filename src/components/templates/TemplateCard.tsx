"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TemplateRow } from "@/types/database";
export function TemplateCard({ template }: { template: TemplateRow }) {
  const href = `/template/${template.id}`;
  return (
    <Link href={href}>
      <Card className="group h-full rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{template.icon}</span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium text-surface-dark dark:text-white">{template.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                수정 {format(new Date(template.updated_at), "PPp", { locale: ko })}
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
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
