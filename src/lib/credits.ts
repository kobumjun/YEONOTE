/** One-time Pro pack: price USD, credits granted */
export const PRO_CREDIT_PACK_USD = 19;
export const PRO_CREDIT_PACK_CREDITS = 50;

/** One-time Team pack */
export const TEAM_CREDIT_PACK_USD = 45;
export const TEAM_CREDIT_PACK_CREDITS = 150;

export function creditsDisplay(remaining: number, ceiling: number): string {
  if (ceiling > 0) return `${remaining}/${ceiling}`;
  return `${remaining}`;
}

export function grantAmountForPack(pack: "pro" | "team"): number {
  return pack === "team" ? TEAM_CREDIT_PACK_CREDITS : PRO_CREDIT_PACK_CREDITS;
}
