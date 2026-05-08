import { Layers, MonitorSmartphone, FileDown } from "lucide-react";

const items = [
  {
    icon: Layers,
    title: "One Prompt, Four Formats",
    body: "Type what you need. YEO detects whether it's a document, presentation, image, or template — and creates the right output automatically.",
  },
  {
    icon: MonitorSmartphone,
    title: "Edit Everything In-Browser",
    body: "Refine your documents, rearrange slides, adjust templates — all without leaving YEO. No downloads needed to make changes.",
  },
  {
    icon: FileDown,
    title: "Export Anywhere",
    body: "Download as .docx, .pptx, .pdf, or image. Copy to clipboard. Share via link. Your content, your format.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
        Why teams choose YEO
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
        One place for every kind of AI output — from first prompt to finished file.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/40 text-yeo-600 dark:text-yeo-400">
              <Icon className="size-5 stroke-[1.5]" />
            </div>
            <h3 className="mt-4 font-semibold tracking-[-0.02em] text-foreground">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
