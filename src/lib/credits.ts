/** New users receive this many tutorial credits (Supabase trigger + column default). */
export const TUTORIAL_SIGNUP_CREDITS = 3;

/** One-time Pro pack: price USD, credits granted */
export const PRO_CREDIT_PACK_USD = 19;
export const PRO_CREDIT_PACK_CREDITS = 100;

/** One-time Team pack */
export const TEAM_CREDIT_PACK_USD = 45;
export const TEAM_CREDIT_PACK_CREDITS = 300;

export function creditsDisplay(remaining: number, ceiling: number): string {
  if (ceiling > 0) return `${remaining}/${ceiling}`;
  return `${remaining}`;
}

export function grantAmountForPack(pack: "pro" | "team"): number {
  return pack === "team" ? TEAM_CREDIT_PACK_CREDITS : PRO_CREDIT_PACK_CREDITS;
}
