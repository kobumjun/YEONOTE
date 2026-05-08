import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreationType } from "@/types/template";

export function creditsForCreationType(type: CreationType): number {
  if (type === "image") return 3;
  if (type === "presentation") return 2;
  return 1;
}

export async function deductAiCreditsAtomic(
  supabase: SupabaseClient,
  userId: string,
  creditsBefore: number,
  amount: number
): Promise<{ creditsRemaining: number } | { error: string; code: "NO_CREDITS" | "CREDIT_RACE" }> {
  if (creditsBefore < amount) {
    return { error: `This generation needs ${amount} credits.`, code: "NO_CREDITS" };
  }
  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update({ ai_credits: creditsBefore - amount })
    .eq("id", userId)
    .eq("ai_credits", creditsBefore)
    .select("ai_credits")
    .single();

  if (error || updatedProfile == null) {
    return { error: "Failed to deduct credits. Please try again shortly.", code: "CREDIT_RACE" };
  }
  return { creditsRemaining: updatedProfile.ai_credits ?? 0 };
}
