import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import type { TopBarProfile } from "@/types/top-bar-profile";
import { MobileNav } from "@/components/layout/MobileNav";
import Link from "next/link";
import { resolveAuthEmail, resolveAvatarFromMeta, resolveDisplayName, safeHttpAvatarUrl } from "@/lib/profile-display";
import { normalizePlan } from "@/lib/subscription";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, plan")
    .eq("id", user.id)
    .single();

  const meta = user.user_metadata as Record<string, unknown> | undefined;

  const displayName = resolveDisplayName(profile?.full_name, meta);
  const email = resolveAuthEmail(user?.email, meta);
  const avatarUrl =
    safeHttpAvatarUrl(profile?.avatar_url?.trim()) ?? resolveAvatarFromMeta(meta);
  const plan = normalizePlan(profile?.plan);

  const topProfile: TopBarProfile = {
    displayName,
    email,
    avatarUrl,
    plan,
  };

  return (
    <div className="flex min-h-screen yeo-app-gradient">
      <Sidebar
        plan={plan}
        displayName={displayName}
        email={email}
        avatarUrl={avatarUrl}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar profile={topProfile} />
        <MobileNav
          email={email}
          displayName={displayName}
          plan={plan}
        />
        <main className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</main>
        <footer className="border-t border-border/80 bg-background/60 px-4 py-4 text-xs text-muted-foreground backdrop-blur-sm md:px-6">
          <div className="mx-auto flex max-w-6xl items-center gap-4">
            <Link href="/privacy" className="transition-colors duration-200 hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors duration-200 hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
