import type { Profile } from "@/types/database";

export const FREE_MAX_TEMPLATES = 10;

export function effectivePlan(profile: Pick<Profile, "plan">): "free" | "pro" | "team" {
  return profile.plan ?? "free";
}

export function canUseExport(plan: string): boolean {
  return plan === "pro" || plan === "team";
}

/** AI generation requires at least one remaining credit. */
export function canGenerateAI(aiCredits: number): boolean {
  return aiCredits > 0;
}
