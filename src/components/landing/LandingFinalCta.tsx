import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingFinalCta() {
  return (
    <section className="px-4 py-20 md:py-28">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border/70 bg-card/80 px-8 py-14 text-center shadow-lg shadow-violet-500/5 backdrop-blur-md dark:shadow-black/40 md:px-12 md:py-16">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">Ready to create?</h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground md:text-base">
          Start with 5 free credits. No credit card required.
        </p>
        <div className="mt-10 flex justify-center">
          <GoogleSignInButton
            next="/dashboard"
            size="lg"
            label="Get Started — Free"
            className={cn(buttonVariants({ size: "lg" }), "yeo-gradient-btn h-12 rounded-2xl px-10 text-base font-semibold shadow-md")}
          />
        </div>
      </div>
    </section>
  );
}
