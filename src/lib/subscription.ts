export type UserPlan = "free" | "plus" | "pro";

export type AgentAction =
  | "generate_deck"
  | "generate_outline"
  | "add_speaker_notes"
  | "rewrite_slide"
  | "add_slide"
  | "web_research"
  | "generate_script"
  | "style_unify"
  | "ai_rewrite"
  | "compress"
  | "expand"
  | "review_deck"
  | "audience_optimize"
  | "competitive_analysis"
  | "tone_transform";

export const PLAN_ACCESS: Record<UserPlan, AgentAction[]> = {
  free: [
    "generate_deck",
    "generate_outline",
    "add_speaker_notes",
    "rewrite_slide",
    "add_slide",
  ],
  plus: [
    "generate_deck",
    "generate_outline",
    "add_speaker_notes",
    "rewrite_slide",
    "add_slide",
    "web_research",
    "generate_script",
    "style_unify",
    "ai_rewrite",
    "compress",
    "expand",
  ],
  pro: [
    "generate_deck",
    "generate_outline",
    "add_speaker_notes",
    "rewrite_slide",
    "add_slide",
    "web_research",
    "generate_script",
    "style_unify",
    "ai_rewrite",
    "compress",
    "expand",
    "review_deck",
    "audience_optimize",
    "competitive_analysis",
    "tone_transform",
  ],
};

export const DAILY_AI_LIMITS: Record<UserPlan, number> = {
  free: 8,
  plus: 999,
  pro: 999,
};

export const DECK_LIMITS: Record<UserPlan, number> = {
  free: 2,
  plus: 999,
  pro: 999,
};

export const SLIDE_LIMITS: Record<UserPlan, number> = {
  free: 10,
  plus: 50,
  pro: 9999,
};

export function normalizePlan(raw: string | null | undefined): UserPlan {
  if (raw === "plus" || raw === "pro") return raw;
  return "free";
}

export function planLabel(plan: UserPlan): string {
  if (plan === "plus") return "Plus";
  if (plan === "pro") return "Pro";
  return "Free";
}

export function canUseAgentAction(plan: UserPlan, action: AgentAction): boolean {
  return PLAN_ACCESS[plan].includes(action);
}

export function canExportPptx(plan: UserPlan): boolean {
  return plan === "plus" || plan === "pro";
}

export function pdfHasWatermark(plan: UserPlan): boolean {
  return plan === "free";
}
