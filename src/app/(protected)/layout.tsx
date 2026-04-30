import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import type { TopBarProfile } from "@/types/top-bar-profile";
import { MobileNav } from "@/components/layout/MobileNav";
import { GenerateModal } from "@/components/templates/GenerateModal";
import Link from "next/link";
import { resolveAuthEmail, resolveAvatarFromMeta, resolveDisplayName, safeHttpAvatarUrl } from "@/lib/profile-display";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, ai_credits, ai_credits_ceiling")
    .eq("id", user.id)
    .single();

  const meta = user.user_metadata as Record<string, unknown> | undefined;

  const displayName = resolveDisplayName(profile?.full_name, meta);
  const email = resolveAuthEmail(user?.email, meta);
  const avatarUrl =
    safeHttpAvatarUrl(profile?.avatar_url?.trim()) ?? resolveAvatarFromMeta(meta);
  const aiCredits = profile?.ai_credits ?? 0;
  const aiCreditsCeiling = profile?.ai_credits_ceiling ?? 0;

  const topProfile: TopBarProfile = {
    displayName,
    email,
    avatarUrl,
    aiCredits,
    aiCreditsCeiling,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar aiCredits={aiCredits} aiCreditsCeiling={aiCreditsCeiling} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar profile={topProfile} />
        <MobileNav
          email={email}
          displayName={displayName}
          aiCredits={aiCredits}
          aiCreditsCeiling={aiCreditsCeiling}
        />
        <main className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</main>
        <footer className="border-t bg-background px-4 py-3 text-xs text-muted-foreground md:px-6">
          <div className="mx-auto flex max-w-6xl items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-foreground">서비스 약관</Link>
          </div>
        </footer>
      </div>
      <GenerateModal />
    </div>
  );
}
