"use client";

import { useCallback, useEffect, useState } from "react";
import type { TemplateRow } from "@/types/database";
import { withAuth } from "@/lib/auth-fetch";

export function useTemplate(id: string | null) {
  const [template, setTemplate] = useState<TemplateRow | null>(null);
  const [loading, setLoading] = useState(Boolean(id));

  const refresh = useCallback(async () => {
    if (!id) {
      setTemplate(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/templates/${id}`, await withAuth());
    const j = await res.json();
    if (res.ok) setTemplate(j.template);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { template, loading, refresh };
}
