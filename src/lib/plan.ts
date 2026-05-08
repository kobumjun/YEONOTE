import type { Profile } from "@/types/database";

export function effectivePlan(profile: Pick<Profile, "plan">): "free" | "starter" | "growth" | "bulk" {
  return profile.plan ?? "free";
}

/** AI generation requires at least one remaining credit. */
export function canGenerateAI(aiCredits: number): boolean {
  return aiCredits > 0;
}
