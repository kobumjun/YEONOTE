import { variantIdForPlan, type BillingInterval } from "@/lib/lemon-billing";
import type { UserPlan } from "@/lib/subscription";

export function getLemonVariantIdForSubscription(
  plan: UserPlan,
  interval: BillingInterval
): string | null {
  if (plan === "free") return null;
  return variantIdForPlan(plan, interval);
}
