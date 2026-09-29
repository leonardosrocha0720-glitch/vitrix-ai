"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Sale } from "@/lib/sales";

/**
 * Carrega as vendas do usuário. Busca na montagem, então voltar para o
 * dashboard depois de registrar em outra tela já traz o número atualizado.
 */
export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  const fetchSales = useCallback(async (): Promise<Sale[]> => {
    const { data } = await supabase.from("sales").select("*").order("date", { ascending: false });
    return data ?? [];
  }, [supabase]);

  useEffect(() => {
    let active = true;
    fetchSales().then((data) => {
      if (!active) return;
      setSales(data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [fetchSales]);

  const addSale = useCallback(
    async (input: { description: string; amount: number; date: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { error: "Sessão expirada. Entre novamente." };

      const { error } = await supabase.from("sales").insert({ user_id: user.id, ...input });
      if (error) return { error: "Não foi possível registrar a venda." };

      setSales(await fetchSales());
      return {};
    },
    [supabase, fetchSales],
  );

  const deleteSale = useCallback(
    async (id: string) => {
      await supabase.from("sales").delete().eq("id", id);
      setSales(await fetchSales());
    },
    [supabase, fetchSales],
  );

  return { sales, loading, addSale, deleteSale };
}
