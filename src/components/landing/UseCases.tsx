import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const cases = [
  {
    emoji: "📋",
    title: "Work management",
    subtitle: "Projects & ops",
    desc: "Track projects, meetings, and priorities on a single structured page.",
    preview: ["Weekly board", "Action items", "Status tracking"],
  },
  {
    emoji: "📚",
    title: "Study planner",
    subtitle: "Learning",
    desc: "Plan subjects, review cycles, and time blocks in a visual layout.",
    preview: ["Weekly goals", "Time blocks", "Checklists"],
  },
  {
    emoji: "💰",
    title: "Budget tracker",
    subtitle: "Personal finance",
    desc: "Log income and expenses with category summaries and savings goals.",
    preview: ["Monthly overview", "Categories", "Savings targets"],
  },
  {
    emoji: "🏋️",
    title: "Fitness planner",
    subtitle: "Health",
    desc: "Log workouts, meals, and progress with a clean training dashboard.",
    preview: ["Weekly split", "Set log", "Recovery notes"],
  },
  {
    emoji: "📖",
    title: "Reading log",
    subtitle: "Hobbies",
    desc: "Capture books, quotes, and ratings in a personal library view.",
    preview: ["Reading", "Finished", "Highlights"],
  },
  {
    emoji: "🎯",
    title: "Goal tracker",
    subtitle: "Growth",
    desc: "Connect quarterly goals with weekly habits and lightweight reviews.",
    preview: ["Objectives", "Key results", "Weekly review"],
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="scroll-mt-20 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
          Use cases
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Inspiration for what you can build with YEO—then make it yours with AI or manual editing.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <Card
              key={c.title}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden>
                    {c.emoji}
                  </span>
                  <div>
                    <CardTitle className="text-lg tracking-[-0.02em]">{c.title}</CardTitle>
                    <CardDescription className="text-xs">{c.subtitle}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <div className="mb-2 h-2 w-1/3 rounded bg-border" />
                  <ul className="space-y-1.5">
                    {c.preview.map((line) => (
                      <li key={line} className="flex items-center gap-2">
                        <span className="size-1.5 shrink-0 rounded-full bg-yeo-400" />
                        <span className="truncate">{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
