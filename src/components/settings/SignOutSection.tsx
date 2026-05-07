"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutSection({ email }: { email: string }) {
  const router = useRouter();

  async function handleSignOut() {
    if (!window.confirm("Are you sure you want to sign out?")) return;
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Signed in as</p>
          <p className="text-sm text-muted-foreground">{email || "—"}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => void handleSignOut()}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
