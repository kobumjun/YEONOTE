import { Logo } from "@/components/shared/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface dark:bg-slate-950">
      <div className="border-b bg-white px-4 py-4 dark:bg-slate-950">
        <Logo />
      </div>
      <div className="flex flex-1 items-center justify-center p-6">{children}</div>
    </div>
  );
}
