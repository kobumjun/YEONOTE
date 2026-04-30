import { Hero } from "@/components/landing/Hero";
import { Demo } from "@/components/landing/Demo";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { UseCases } from "@/components/landing/UseCases";
import { Footer } from "@/components/landing/Footer";
import { Logo } from "@/components/shared/Logo";
import { LandingHeaderActions } from "@/components/landing/LandingHeaderActions";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Logo />
          <LandingHeaderActions />
        </div>
      </header>
      <main>
        <Hero />
        <Demo />
        <Features />
        <UseCases />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
