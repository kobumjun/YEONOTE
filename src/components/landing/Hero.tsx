import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-28 pt-16 sm:pt-24 md:pb-32 md:pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(124,58,237,0.12),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(37,99,235,0.08),transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(167,139,250,0.15),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:56px_56px] opacity-40 [mask-image:radial-gradient(ellipse_75%_55%_at_50%_0%,#000_45%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] dark:opacity-100" />

      <div className="relative mx-auto max-w-4xl text-center">
        <span className="mb-6 inline-flex rounded-full border border-violet-200/80 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200">
          AI Content Creator
        </span>

        <h1 className="font-heading text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
          One prompt.
          <br />
          <span className="yeo-gradient-text">Any format.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
          Documents, presentations, images, and templates — describe what you need and AI creates it instantly.
        </p>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground/90">No switching tools. No learning curves. Just results.</p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <GoogleSignInButton
            next="/dashboard"
            size="lg"
            label="Get Started Free"
            className={cn(
              buttonVariants({ size: "lg" }),
              "yeo-gradient-btn h-12 rounded-2xl px-8 text-base font-semibold shadow-md"
            )}
          />
          <Link
            href="/#use-cases"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "inline-flex h-12 items-center justify-center rounded-2xl border-border/80 bg-card/60 px-8 text-base font-semibold shadow-sm backdrop-blur-sm transition-all hover:bg-muted/60"
            )}
          >
            See Examples
          </Link>
        </div>
      </div>
    </section>
  );
}
