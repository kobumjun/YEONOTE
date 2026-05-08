import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "@/components/editor/TemplateEditor";
import { CreationViewer } from "@/components/creation/CreationViewer";
import type { DocumentContent, TemplateBlock } from "@/types/template";
import { asTemplateContent } from "@/types/template";
import { legacyHtmlDocumentToBlocks } from "@/lib/document-legacy";

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tpl } = await supabase.from("templates").select("*").eq("id", id).maybeSingle();
  if (!tpl || tpl.user_id !== user.id) notFound();

  if (tpl.creation_type === "presentation" || tpl.creation_type === "image") {
    return (
      <CreationViewer
        templateId={tpl.id}
        title={tpl.title}
        type={tpl.creation_type}
        content={tpl.content}
        aiPrompt={tpl.ai_prompt}
        isDeleted={tpl.is_deleted}
      />
    );
  }

  if (tpl.creation_type === "document") {
    const c = tpl.content as DocumentContent;
    const hasBlocks = Array.isArray(c?.blocks) && c.blocks.length > 0;
    const blocks = (hasBlocks ? c.blocks! : legacyHtmlDocumentToBlocks(c?.html)) as TemplateBlock[];
    return (
      <TemplateEditor
        creationMode="document"
        templateId={tpl.id}
        initial={{
          title: tpl.title,
          icon: tpl.icon ?? "📝",
          cover: null,
          blocks,
          is_public: tpl.is_public,
          is_deleted: tpl.is_deleted,
        }}
      />
    );
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
        is_public: tpl.is_public,
        is_deleted: tpl.is_deleted,
      }}
    />
  );
}
