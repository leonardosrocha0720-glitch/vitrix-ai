"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Sale {
  id: string;
  description: string;
  amount: number;
  date: string;
  created_at: string;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#13131A] border border-white/10 rounded-2xl p-6">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function sumSales(sales: Sale[], filterFn: (date: Date) => boolean) {
  return sales
    .filter((s) => filterFn(new Date(s.date + "T00:00:00")))
    .reduce((acc, s) => acc + Number(s.amount), 0);
}

export default function DashboardPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);
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

  async function handleAddSale(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }
    await supabase.from("sales").insert({
      user_id: user.id,
      description: form.description,
      amount: parseFloat(form.amount),
      date: form.date,
    });
    setForm({ description: "", amount: "", date: new Date().toISOString().split("T")[0] });
    setSales(await fetchSales());
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("sales").delete().eq("id", id);
    setSales(await fetchSales());
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const last7 = new Date(today);
  last7.setDate(last7.getDate() - 7);
  const last30 = new Date(today);
  last30.setDate(last30.getDate() - 30);

  const stats = {
    hoje: sumSales(sales, (d) => d >= today),
    ontem: sumSales(sales, (d) => d >= yesterday && d < today),
    last7: sumSales(sales, (d) => d >= last7),
    last30: sumSales(sales, (d) => d >= last30),
  };

  return (
    <div className="p-8 pt-20 lg:pt-8 max-w-5xl">
      <h2 className="text-2xl font-bold text-white mb-2">Dashboard de Vendas</h2>
      <p className="text-gray-400 mb-8">Registre e acompanhe suas vendas de sites</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Hoje" value={formatCurrency(stats.hoje)} />
        <StatCard label="Ontem" value={formatCurrency(stats.ontem)} />
        <StatCard label="Últimos 7 dias" value={formatCurrency(stats.last7)} />
        <StatCard label="Últimos 30 dias" value={formatCurrency(stats.last30)} />
      </div>

      <div className="bg-[#13131A] border border-white/10 rounded-2xl p-6 mb-8">
        <h3 className="text-white font-semibold mb-4">Adicionar Venda</h3>
        <form onSubmit={handleAddSale} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Descrição (ex: Site para Barbearia Silva)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            required
            className="flex-1 bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm"
          />
          <input
            type="number"
            placeholder="Valor (R$)"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            required
            min="0"
            step="0.01"
            className="sm:w-36 bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm"
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
            className="sm:w-40 bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            {submitting ? "Salvando..." : "+ Adicionar"}
          </button>
        </form>
      </div>

      <div className="bg-[#13131A] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-white font-semibold">Histórico de Vendas</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : sales.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhuma venda registrada ainda</div>
        ) : (
          <div className="divide-y divide-white/5">
            {sales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-white text-sm font-medium">{sale.description}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {new Date(sale.date + "T00:00:00").toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-green-400 font-semibold">
                    {formatCurrency(Number(sale.amount))}
                  </span>
                  <button
                    onClick={() => handleDelete(sale.id)}
                    aria-label="Excluir venda"
                    className="text-gray-600 hover:text-red-400 transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
