import { Suspense } from "react";
import { DashboardClient } from "@/components/templates/DashboardClient";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">로딩…</div>}>
      <DashboardClient />
    </Suspense>
  );
}
