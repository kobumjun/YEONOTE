import { Suspense } from "react";
import { CreationsListClient } from "@/components/templates/CreationsListClient";

export default function CreationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <CreationsListClient />
    </Suspense>
  );
}
