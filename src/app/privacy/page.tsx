import Link from "next/link";

const updatedAt = "2026-04-30";

const sections: { title: string; body: string[] }[] = [
  {
    title: "1. Product Overview",
    body: [
      "Product: YEO (https://yeonote.vercel.app)",
      `Last updated: ${updatedAt}`,
    ],
  },
  {
    title: "2. Information We Collect",
    body: [
      "Google account information (name, email, profile image)",
      "Template content users create and store",
      "AI generation logs (prompts and usage metadata)",
    ],
  },
  {
    title: "3. Purpose of Use",
    body: [
      "Identity verification and account management",
      "Providing AI template generation features",
      "Improving product quality and reliability",
    ],
  },
  {
    title: "4. Storage and Security",
    body: ["Data is stored in Supabase. Data in transit is encrypted."],
  },
  {
    title: "5. Third-Party Services",
    body: ["Google OAuth", "OpenAI API", "Lemon Squeezy(Billing)"],
  },
  {
    title: "6. Your Rights",
    body: ["You may request account deletion or data export as allowed by applicable law."],
  },
  {
    title: "7. Cookies",
    body: ["We may use essential cookies required for authentication and session management."],
  },
  {
    title: "8. Contact",
    body: ["For privacy-related requests, contact us through the support channel listed on the site."],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Home
          </Link>
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
            Terms of Service
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.02em] text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This policy explains how personal information is handled when you use YEO.
        </p>
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
