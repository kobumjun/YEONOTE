import type { Profile } from "@/types/database";

export const FREE_MONTHLY_AI = 5;
export const FREE_MAX_TEMPLATES = 10;

export function effectivePlan(profile: Pick<Profile, "plan">): "free" | "pro" | "team" {
  return profile.plan ?? "free";
}

export function canUseExport(plan: string): boolean {
  return plan === "pro" || plan === "team";
}

export function canGenerateAI(plan: string, used: number, resetAt: string | null): boolean {
  if (plan === "pro" || plan === "team") return true;
  const now = new Date();
  if (resetAt && new Date(resetAt) <= now) return true;
  return used < FREE_MONTHLY_AI;
}

export function shouldResetUsage(resetAt: string | null): boolean {
  if (!resetAt) return true;
  return new Date(resetAt) <= new Date();
}

export function nextResetFrom(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return d.toISOString();
}
