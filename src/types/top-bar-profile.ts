import type { UserPlan } from "@/lib/subscription";

export type TopBarProfile = {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  plan: UserPlan;
};
