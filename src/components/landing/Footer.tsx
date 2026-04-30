import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#0a0a0a] px-4 py-14 text-neutral-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div>
          <Logo href="/" className="text-white [&_span:last-child]:text-white" />
          <p className="mt-3 max-w-xs text-sm text-neutral-400">
            Design, edit, and share structured templates—powered by AI, refined by you.
          </p>
        </div>
        <div className="flex flex-wrap gap-12 text-sm">
          <div className="space-y-2">
            <p className="font-medium text-white">Product</p>
            <Link href="/#pricing" className="block text-neutral-400 transition-colors duration-200 hover:text-white">
              Pricing
            </Link>
            <Link href="/explore" className="block text-neutral-400 transition-colors duration-200 hover:text-white">
              Explore
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-white">Account</p>
            <Link href="/login" className="block text-neutral-400 transition-colors duration-200 hover:text-white">
              Sign In
            </Link>
            <Link href="/login" className="block text-neutral-400 transition-colors duration-200 hover:text-white">
              Get Started
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-white">Legal</p>
            <Link href="/privacy" className="block text-neutral-400 transition-colors duration-200 hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="block text-neutral-400 transition-colors duration-200 hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} YEO. All rights reserved.
      </p>
    </footer>
  );
}
