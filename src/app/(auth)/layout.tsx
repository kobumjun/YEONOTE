import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface dark:bg-slate-950">
      <div className="border-b bg-white px-4 py-4 dark:bg-slate-950">
        <Logo />
      </div>
      <div className="flex flex-1 items-center justify-center p-6">{children}</div>
      <footer className="border-t bg-background px-4 py-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-4">
          <Link href="/privacy" className="transition-colors duration-200 hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors duration-200 hover:text-foreground">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
