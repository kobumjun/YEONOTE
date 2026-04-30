import Link from "next/link";

const updatedAt = "April 30, 2026";

const sections: { title: string; body: string[] }[] = [
  {
    title: "1. Service overview",
    body: ["YEO is an AI-assisted template and note creation tool."],
  },
  {
    title: "2. Accounts",
    body: ["Accounts use Google OAuth. One person should use one account unless otherwise permitted."],
  },
  {
    title: "3. Credits",
    body: ["Purchased credits are non-refundable unless required by law.", "Credits do not expire unless stated otherwise."],
  },
  {
    title: "4. Acceptable use",
    body: ["You may not use YEO to create or distribute illegal, harmful, or abusive content."],
  },
  {
    title: "5. Intellectual property",
    body: ["You retain rights to templates you create, subject to third-party content you include."],
  },
  {
    title: "6. AI-generated content",
    body: ["AI output may be inaccurate. You are responsible for reviewing results before relying on them."],
  },
  {
    title: "7. Availability",
    body: ["The service is provided on a best-effort basis. We do not guarantee a specific uptime."],
  },
  {
    title: "8. Limitation of liability",
    body: ["To the maximum extent permitted by law, YEO’s liability is limited."],
  },
  {
    title: "9. Suspension and termination",
    body: ["We may suspend or terminate accounts that violate these terms, with or without prior notice."],
  },
  {
    title: "10. Changes",
    body: ["We may update these terms. Material changes will be communicated when reasonable.", `Last updated: ${updatedAt}`],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Home
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
            Privacy Policy
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.02em] text-foreground">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">These terms govern your use of YEO.</p>
        <div className="mt-10 space-y-10">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">{s.title}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                {s.body.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
