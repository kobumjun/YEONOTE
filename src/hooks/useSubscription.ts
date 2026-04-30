"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SubscriptionRow } from "@/types/billing";

export function useSubscription() {
  const [row, setRow] = useState<SubscriptionRow | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setRow(data as SubscriptionRow | null);
    });
  }, []);

  return { subscription: row };
}
