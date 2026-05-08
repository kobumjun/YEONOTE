import { MessageSquareText, Sparkles, Download } from "lucide-react";

const steps = [
  {
    title: "1. Describe",
    body: "Type what you need in plain English.",
    icon: MessageSquareText,
  },
  {
    title: "2. AI creates",
    body: "YEO detects the format and generates polished content.",
    icon: Sparkles,
  },
  {
    title: "3. Edit & export",
    body: "Refine in-browser, then download as .docx, .pptx, or image.",
    icon: Download,
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-muted/20 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
          How it works
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map(({ title, body, icon: Icon }) => (
            <div key={title} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-yeo-600 shadow-sm dark:text-yeo-400">
                <Icon className="size-7 stroke-[1.5]" aria-hidden />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
