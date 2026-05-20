import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PresentationMode } from "@/components/deck/PresentationMode";

export default async function ShareDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: tpl } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .eq("is_public", true)
    .eq("is_deleted", false)
    .maybeSingle();

  if (!tpl || tpl.creation_type !== "presentation") notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-muted/40 px-4 py-2 text-center text-xs text-muted-foreground">
        Public Preview · Read-only
      </div>
      <PresentationMode deckId={tpl.id} title={tpl.title} content={tpl.content} />
    </div>
  );
}
