import Link from "next/link";
import { Hero } from "@/components/landing/Hero";
import { Demo } from "@/components/landing/Demo";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
import { Footer } from "@/components/landing/Footer";
import { Logo } from "@/components/shared/Logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md dark:bg-slate-950/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-lg")}>
              로그인
            </Link>
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "sm" }), "rounded-lg bg-yeo-600 text-primary-foreground hover:bg-yeo-700")}
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>
      <main>
        <Hero />
        <Demo />
        <Features />
        <Pricing />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
