import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PresentationMode } from "@/components/deck/PresentationMode";

export default async function PresentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tpl } = await supabase.from("templates").select("*").eq("id", id).maybeSingle();
  if (!tpl || tpl.user_id !== user.id || tpl.creation_type !== "presentation") notFound();

  return (
    <PresentationMode
      deckId={tpl.id}
      title={tpl.title}
      content={tpl.content}
    />
  );
}
