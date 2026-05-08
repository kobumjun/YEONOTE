"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LANDING_PROMPT_STORAGE_KEY } from "@/lib/landing-prompt-bridge";

const cases = [
  {
    emoji: "📄",
    title: "Documents",
    lines: ["Cover letters", "Business emails", "Blog posts", "Resignation letters"],
    prompt:
      "Write a professional cover letter for a marketing role at a technology startup, highlighting campaign experience and collaboration.",
  },
  {
    emoji: "📊",
    title: "Presentations",
    lines: ["Pitch decks", "Class reports", "Team updates", "Product demos", "Sales proposals"],
    prompt: "Create a 7-slide pitch deck for a fitness app with problem, solution, market, traction, and funding ask.",
  },
  {
    emoji: "🖼️",
    title: "Images",
    lines: ["Posters", "Thumbnails", "Event flyers", "Social media graphics"],
    prompt: "Design a minimalist poster for a jazz concert with date, venue, and ticket line in a clean layout.",
  },
  {
    emoji: "📋",
    title: "Templates",
    lines: ["Project boards", "Workout trackers", "Study planners"],
    prompt: "Build a weekly workout tracker with meal logging, rest days, and a simple progress summary section.",
  },
  {
    emoji: "📝",
    title: "Scripts",
    lines: ["Video scripts", "Podcast outlines", "Speech drafts"],
    prompt: "Write a 5-minute product launch video script with hook, product demo, social proof, and a clear call to action.",
  },
  {
    emoji: "✉️",
    title: "Letters",
    lines: ["Invitations", "Thank you notes", "Recommendations"],
    prompt: "Draft warm thank-you letters to internship supervisors after a summer placement, with space for personalization.",
  },
];

export function UseCases() {
  const router = useRouter();

  function goLoginWithPrompt(prompt: string) {
    try {
      sessionStorage.setItem(LANDING_PROMPT_STORAGE_KEY, prompt);
    } catch {
      /* private mode */
    }
    router.push("/login");
  }

  return (
    <section id="use-cases" className="scroll-mt-20 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
          What will you create today?
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Pick a scenario — we will drop an example prompt in after you sign in so you can generate right away.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <button
              key={c.title}
              type="button"
              onClick={() => goLoginWithPrompt(c.prompt)}
              className="text-left transition-transform duration-200 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-yeo-500"
            >
              <Card className="h-full overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl" aria-hidden>
                      {c.emoji}
                    </span>
                    <CardTitle className="text-lg tracking-[-0.02em]">{c.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {c.lines.map((line) => (
                      <li key={line} className="flex items-center gap-2">
                        <span className="size-1 shrink-0 rounded-full bg-yeo-400" />
                        {line}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs font-medium text-yeo-600 dark:text-yeo-400">Click to try with Google →</p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
