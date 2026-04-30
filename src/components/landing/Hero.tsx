import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_50%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]" />
      <div className="relative mx-auto max-w-4xl text-center">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">YEO</p>
        <h1 className="font-heading text-4xl font-bold tracking-[-0.02em] text-foreground sm:text-5xl md:text-6xl">
          Describe it.
          <br />
          <span className="bg-gradient-to-r from-yeo-500 via-yeo-400 to-yeo-700 bg-clip-text text-transparent">YEO builds it.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          AI-powered template generator. Create structured Notion-style pages in seconds.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <GoogleSignInButton
            next="/dashboard"
            size="lg"
            label="Get Started Free"
            className={cn(buttonVariants({ size: "lg" }), "rounded-xl bg-yeo-600 px-8 text-primary-foreground shadow-sm transition-all duration-200 hover:bg-yeo-700")}
          />
          <Link
            href="/#use-cases"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "rounded-xl border-border bg-background/80 shadow-sm transition-all duration-200 hover:bg-muted/50"
            )}
          >
            See Examples
          </Link>
          <GoogleSignInButton
            next="/dashboard"
            size="lg"
            variant="ghost"
            label="Sign In"
            className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "rounded-xl")}
          />
        </div>
      </div>
    </section>
  );
}
