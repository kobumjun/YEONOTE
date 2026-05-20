import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeckEditor } from "@/components/deck/DeckEditor";

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tpl } = await supabase.from("templates").select("*").eq("id", id).maybeSingle();
  if (!tpl || tpl.user_id !== user.id) notFound();

  if (tpl.creation_type !== "presentation") {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  return (
    <DeckEditor
      deckId={tpl.id}
      initialTitle={tpl.title}
      initialContent={tpl.content}
      aiPrompt={tpl.ai_prompt}
      isDeleted={tpl.is_deleted}
      plan={profile?.plan ?? "free"}
    />
  );
}
