import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingFinalCta() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-gradient-to-br from-yeo-500/10 via-card to-card px-8 py-14 text-center shadow-sm">
        <h2 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">Ready to create?</h2>
        <p className="mt-3 text-muted-foreground">
          Start with 5 free credits. No credit card required.
        </p>
        <div className="mt-8 flex justify-center">
          <GoogleSignInButton
            next="/dashboard"
            size="lg"
            label="Get Started — Free"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-xl bg-yeo-600 px-10 text-primary-foreground shadow-sm transition-all duration-200 hover:bg-yeo-700"
            )}
          />
        </div>
      </div>
    </section>
  );
}
