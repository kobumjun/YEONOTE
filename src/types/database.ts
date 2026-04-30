import type { TemplateContent } from "@/types/template";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  language: string | null;
  theme: string | null;
  plan: "free" | "pro" | "team";
  ai_generations_used: number;
  ai_generations_reset_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TemplateRow = {
  id: string;
  user_id: string;
  title: string;
  icon: string;
  cover: string | null;
  content: TemplateContent;
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
