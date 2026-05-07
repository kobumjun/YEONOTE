import { Suspense } from "react";
import { ExploreClient } from "@/components/templates/ExploreClient";

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">불러오는 중…</div>}>
      <ExploreClient />
    </Suspense>
  );
}
