import Link from "next/link";

const updatedAt = "April 30, 2026";

const sections: { title: string; body: string[] }[] = [
  {
    title: "1. Service overview",
    body: [
      "Service name: YEO (https://yeonote.vercel.app)",
      `Last updated: ${updatedAt}`,
    ],
  },
  {
    title: "2. Information we collect",
    body: [
      "Google account information (name, email, profile image)",
      "Template content you create and save",
      "AI generation logs (prompts and usage metadata)",
    ],
  },
  {
    title: "3. How we use information",
    body: [
      "Authentication and account management",
      "Providing AI template generation features",
      "Improving service quality and reliability",
    ],
  },
  {
    title: "4. Storage and security",
    body: ["Data is stored in Supabase. Transport is encrypted in transit."],
  },
  {
    title: "5. Third-party services",
    body: ["Google OAuth", "OpenAI API", "Lemon Squeezy (payments)"],
  },
  {
    title: "6. Your rights",
    body: ["You may request account deletion or data export where applicable."],
  },
  {
    title: "7. Cookies",
    body: ["We use minimal cookies required for authentication and session management."],
  },
  {
    title: "8. Contact",
    body: ["For privacy-related inquiries, contact us through the channels listed on the site."],
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
          This policy describes how YEO handles personal information when you use the service.
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
