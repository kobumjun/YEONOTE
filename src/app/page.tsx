import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { LandingHeaderActions } from "@/components/landing/LandingHeaderActions";
import { Footer } from "@/components/landing/Footer";

const FEATURES = [
  {
    title: "AI that builds with you",
    description:
      "Generate entire decks, rewrite slides, create outlines — all from a simple prompt.",
  },
  {
    title: "Research built in",
    description:
      "AI searches the web for the latest data, stats, and sources. No more tab-switching.",
  },
  {
    title: "Get feedback before you present",
    description:
      "AI analyzes your deck's logic, persuasiveness, and structure. Like having a presentation coach.",
  },
];

const PRICING_PREVIEW = [
  { name: "Free", price: "$0", highlight: false },
  { name: "Plus", price: "$15/mo", highlight: true },
  { name: "Pro", price: "$30/mo", highlight: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#2D3436]">
      <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16 md:px-6">
          <Logo />
          <LandingHeaderActions />
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 text-center md:px-6 md:py-28">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Build presentations that actually impress.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#636E72]">
            AI-powered editor that researches, writes, designs, and reviews your slides — so you can
            focus on presenting.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-[#6C5CE7] px-8 text-base font-semibold text-white hover:bg-[#5A4BD1]"
          >
            Start for free
          </Link>
          <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] shadow-lg">
            <div className="flex aspect-video items-center justify-center text-[#636E72]">
              <div className="text-center">
                <p className="text-sm font-medium">Editor preview</p>
                <p className="mt-1 text-xs">Slides + AI Agent panel</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[#E5E7EB] bg-[#F9FAFB] py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-3 md:px-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-[#6C5CE7]">{f.title}</h3>
                <p className="mt-2 text-sm text-[#636E72]">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 text-center md:px-6">
            <h2 className="text-2xl font-bold">Simple pricing</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {PRICING_PREVIEW.map((p) => (
                <div
                  key={p.name}
                  className={`rounded-2xl border p-6 ${
                    p.highlight
                      ? "border-[#6C5CE7] bg-[#F8F7FF]"
                      : "border-[#E5E7EB] bg-white"
                  }`}
                >
                  <p className="font-semibold">{p.name}</p>
                  <p className="mt-2 text-2xl font-bold">{p.price}</p>
                </div>
              ))}
            </div>
            <Link
              href="/login"
              className="mt-10 inline-flex items-center justify-center rounded-xl bg-[#6C5CE7] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5A4BD1]"
            >
              Start for free
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
