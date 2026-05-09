import { Hero } from "@/components/landing/Hero";
import { Demo } from "@/components/landing/Demo";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { UseCases } from "@/components/landing/UseCases";
import { LandingFinalCta } from "@/components/landing/LandingFinalCta";
import { Footer } from "@/components/landing/Footer";
import { Logo } from "@/components/shared/Logo";
import { LandingHeaderActions } from "@/components/landing/LandingHeaderActions";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-background to-neutral-100/80 dark:from-background dark:via-background dark:to-neutral-950">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16 md:px-6">
          <Logo />
          <LandingHeaderActions />
        </div>
      </header>
      <main>
        <Hero />
        <Demo />
        <Features />
        <HowItWorks />
        <UseCases />
        <Pricing />
        <LandingFinalCta />
      </main>
      <Footer />
    </div>
  );
}
