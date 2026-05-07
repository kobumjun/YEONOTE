import { Sparkles, LayoutGrid, Share2 } from "lucide-react";

const items = [
  {
    icon: Sparkles,
    title: "AI Generation",
    body: "Describe your needs naturally and YEO assembles rich structured blocks automatically.",
  },
  {
    icon: LayoutGrid,
    title: "Block Editor",
    body: "Reorder headings, toggles, to-dos, and databases with drag and drop.",
  },
  {
    icon: Share2,
    title: "Explore & Share",
    body: "Publish templates to Explore, duplicate favorites into your workspace, and share read-only links.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
        Why teams choose YEO
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
        From one sentence to a polished workspace layout, all essential tools in one place.
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
