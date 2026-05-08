import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "@/components/editor/TemplateEditor";
import { CreationViewer } from "@/components/creation/CreationViewer";
import type { TemplateBlock } from "@/types/template";
import { asTemplateContent } from "@/types/template";

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tpl } = await supabase.from("templates").select("*").eq("id", id).maybeSingle();
  if (!tpl || tpl.user_id !== user.id) notFound();

  if (tpl.creation_type && tpl.creation_type !== "template") {
    return <CreationViewer title={tpl.title} type={tpl.creation_type} content={tpl.content} />;
  }

  const content = asTemplateContent(tpl.content);
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
        is_public: tpl.is_public,
        is_deleted: tpl.is_deleted,
      }}
    />
  );
}
