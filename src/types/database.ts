import type { CreationContent } from "@/types/template";
import type { UserPlan } from "@/lib/subscription";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  language: string | null;
  theme: string | null;
  plan: UserPlan;
  subscription_id: string | null;
  subscription_status: "inactive" | "active" | "cancelled" | "expired" | "past_due" | "paused";
  subscription_ends_at: string | null;
  ai_generations_used: number;
  ai_generations_reset_at: string | null;
  /** Legacy columns — no longer used for billing */
  ai_credits: number;
  ai_credits_ceiling: number;
  created_at: string;
  updated_at: string;
};

export type TemplateRow = {
  id: string;
  user_id: string;
  title: string;
  icon: string;
  cover: string | null;
  creation_type: "presentation";
  content: CreationContent;
  tags: string[] | null;
  category: string | null;
  is_public: boolean;
  is_favorited: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  likes_count: number;
  duplicates_count: number;
  original_template_id: string | null;
  ai_prompt: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};
