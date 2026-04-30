import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar, type TopBarProfile } from "@/components/layout/TopBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { GenerateModal } from "@/components/templates/GenerateModal";

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
  const metaName = (typeof meta?.full_name === "string" && meta.full_name) || (typeof meta?.name === "string" && meta.name) || "";
  const metaAvatar = typeof meta?.avatar_url === "string" ? meta.avatar_url : null;

  const displayName = profile?.full_name?.trim() || metaName || "";
  const email = user.email ?? "";
  const avatarUrl = profile?.avatar_url?.trim() || metaAvatar || null;
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
      </div>
      <GenerateModal />
    </div>
  );
}
