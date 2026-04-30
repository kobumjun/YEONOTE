import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "@/components/editor/TemplateEditor";
import type { TemplateBlock } from "@/types/template";
import type { TemplateContent } from "@/types/template";

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tpl } = await supabase.from("templates").select("*").eq("id", id).maybeSingle();
  if (!tpl || tpl.user_id !== user.id) notFound();

  const content = (tpl.content ?? { blocks: [] }) as TemplateContent;
  const blocks = (content.blocks ?? []) as TemplateBlock[];

  return (
    <TemplateEditor
      templateId={tpl.id}
      initial={{
        title: tpl.title,
        icon: tpl.icon,
        cover: tpl.cover,
        blocks,
        is_favorited: tpl.is_favorited,
      }}
    />
  );
}
