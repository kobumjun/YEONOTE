import type { Profile } from "@/types/database";
import { normalizePlan, type UserPlan } from "@/lib/subscription";

export function effectivePlan(profile: Pick<Profile, "plan">): UserPlan {
  return normalizePlan(profile.plan);
}

export function hasActiveSubscription(
  profile: Pick<Profile, "subscription_status">
): boolean {
  return profile.subscription_status === "active";
}
