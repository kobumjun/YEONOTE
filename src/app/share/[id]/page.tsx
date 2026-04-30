import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "@/components/editor/TemplateEditor";
import type { TemplateBlock } from "@/types/template";
import type { TemplateContent } from "@/types/template";

export default async function ShareTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: tpl } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .eq("is_public", true)
    .eq("is_deleted", false)
    .maybeSingle();

  if (!tpl) notFound();

  const content = (tpl.content ?? { blocks: [] }) as TemplateContent;
  const blocks = (content.blocks ?? []) as TemplateBlock[];

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-muted/40 px-4 py-2 text-center text-xs text-muted-foreground">
        Public preview · Read only
      </div>
      <TemplateEditor
        templateId={tpl.id}
        initial={{
          title: tpl.title,
          icon: tpl.icon,
          cover: tpl.cover,
          blocks,
          is_favorited: false,
        }}
        readOnly
      />
    </div>
  );
}
