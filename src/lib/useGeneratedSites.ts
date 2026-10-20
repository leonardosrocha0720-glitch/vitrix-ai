"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Datas de criação dos sites gerados pelo usuário (RLS já restringe às dele). */
export function useGeneratedSites() {
  const [dates, setDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    let active = true;
    supabase
      .from("generated_sites")
      .select("created_at")
      .then(({ data }) => {
        if (!active) return;
        setDates((data ?? []).map((r) => new Date(r.created_at)));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [supabase]);

  return { dates, loading };
}
