import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "@/components/editor/TemplateEditor";
import { CreationViewer } from "@/components/creation/CreationViewer";
import { asTemplateContent, type DocumentContent, type TemplateBlock } from "@/types/template";
import { legacyHtmlDocumentToBlocks } from "@/lib/document-legacy";

export default async function SharedTemplatePage({ params }: { params: Promise<{ id: string }> }) {
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

  const banner = (
    <div className="border-b border-border bg-muted/40 px-4 py-2 text-center text-xs text-muted-foreground">
      Public Templates · Read-only
    </div>
  );

  if (tpl.creation_type === "presentation" || tpl.creation_type === "image") {
    return (
      <div className="min-h-screen bg-background">
        {banner}
        <CreationViewer
          readOnly
          templateId={tpl.id}
          title={tpl.title}
          type={tpl.creation_type}
          content={tpl.content}
          aiPrompt={tpl.ai_prompt}
        />
      </div>
    );
  }

  if (tpl.creation_type === "document") {
    const c = tpl.content as DocumentContent;
    const hasBlocks = Array.isArray(c?.blocks) && c.blocks.length > 0;
    const blocks = (hasBlocks ? c.blocks! : legacyHtmlDocumentToBlocks(c?.html)) as TemplateBlock[];
    return (
      <div className="min-h-screen bg-background">
        {banner}
        <TemplateEditor
          readOnly
          creationMode="document"
          templateId={tpl.id}
          initial={{
            title: tpl.title,
            icon: tpl.icon ?? "📝",
            cover: null,
            blocks,
            is_public: true,
          }}
        />
      </div>
    );
  }

  const content = asTemplateContent(tpl.content);
  const blocks = (content.blocks ?? []) as TemplateBlock[];

  return (
    <div className="min-h-screen bg-background">
      {banner}
      <TemplateEditor
        templateId={tpl.id}
        initial={{
          title: tpl.title,
          icon: tpl.icon,
          cover: tpl.cover,
          blocks,
          is_public: true,
        }}
        readOnly
      />
    </div>
  );
}
