import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.35),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_40%,rgba(99,102,241,0.08)_50%,transparent_60%)] animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="relative mx-auto max-w-4xl text-center">
        <p className="mb-4 text-sm font-medium text-yeo-600 dark:text-yeo-400">YEO</p>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-surface-dark dark:text-white sm:text-5xl md:text-6xl">
          Describe it.
          <br />
          <span className="bg-gradient-to-r from-yeo-500 to-yeo-700 bg-clip-text text-transparent">YEO builds it.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">말만 하세요. YEO가 만듭니다.</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <GoogleSignInButton
            next="/dashboard"
            size="lg"
            label="시작하기"
            className={cn(buttonVariants({ size: "lg" }), "rounded-xl bg-yeo-600 px-8 text-primary-foreground hover:bg-yeo-700")}
          />
          <GoogleSignInButton
            next="/dashboard"
            size="lg"
            variant="outline"
            label="로그인"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "rounded-xl border-yeo-200 bg-white/80 dark:bg-slate-900/80"
            )}
          />
        </div>
      </div>
    </section>
  );
}
