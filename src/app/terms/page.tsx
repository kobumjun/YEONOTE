import Link from "next/link";

const updatedAt = "2026-04-30";

const sections: { title: string; body: string[] }[] = [
  {
    title: "1. Product Overview",
    body: ["YEO is an AI-powered template and note-building tool."],
  },
  {
    title: "2. Account",
    body: ["Accounts are connected through Google OAuth. In principle, one person should use one account."],
  },
  {
    title: "3. Credits",
    body: ["Purchased credits may be non-refundable except where required by law.", "Credits do not expire unless otherwise stated."],
  },
  {
    title: "4. Acceptable Use",
    body: ["You must not use YEO to create or distribute illegal, harmful, or abusive content."],
  },
  {
    title: "5. Intellectual Property",
    body: ["Users retain rights to templates they create. Third-party content remains subject to the owner’s terms."],
  },
  {
    title: "6. AI-Generated Content",
    body: ["AI output may be inaccurate. You are responsible for reviewing results before use."],
  },
  {
    title: "7. Availability",
    body: ["The product is provided on a best-effort basis and specific uptime is not guaranteed."],
  },
  {
    title: "8. Limitation of Liability",
    body: ["YEO’s liability may be limited to the extent permitted by applicable law."],
  },
  {
    title: "9. Suspension and Termination",
    body: ["Accounts may be suspended or terminated for policy violations, with or without notice."],
  },
  {
    title: "10. Changes to Terms",
    body: ["These terms may change over time. Material changes will be communicated through reasonable channels.", `Last updated: ${updatedAt}`],
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
        <p className="mt-2 text-sm text-muted-foreground">Core terms that govern your use of YEO.</p>
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
