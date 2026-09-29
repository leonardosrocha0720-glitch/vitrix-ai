"use client";

import { useMemo, useState } from "react";
import { useSales } from "@/lib/useSales";
import { dayKey, formatCurrency, type Sale } from "@/lib/sales";

const labelClass = "font-data text-[9.5px] uppercase tracking-[0.14em] text-muted";
const inputClass =
  "w-full rounded-[10px] border border-line bg-[#0a0a12] px-3 py-2.5 text-[13.5px] text-ink outline-none transition-all placeholder:text-[#565270] focus:border-brand/60 focus:ring-[3px] focus:ring-brand/15";

/** Agrupa por mês para o histórico não virar uma lista infinita e sem marco. */
function groupByMonth(sales: Sale[]) {
  const groups = new Map<string, { label: string; total: number; items: Sale[] }>();

  for (const sale of sales) {
    const d = new Date(sale.date + "T00:00:00");
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const group = groups.get(key) ?? { label, total: 0, items: [] };
    group.total += Number(sale.amount);
    group.items.push(sale);
    groups.set(key, group);
  }

  return [...groups.values()];
}

export default function HistoricoPage() {
  const { sales, loading, addSale, deleteSale } = useSales();
  const [form, setForm] = useState({ description: "", amount: "", date: dayKey(new Date()) });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(
    () => sales.reduce((acc, s) => acc + Number(s.amount), 0),
    [sales],
  );
  const groups = useMemo(() => groupByMonth(sales), [sales]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await addSale({
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      date: form.date,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setForm({ description: "", amount: "", date: dayKey(new Date()) });
    }
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4 pl-16 lg:px-6 lg:pl-6">
        <div className="min-w-0">
          <h1 className="font-display text-[21px] font-bold tracking-[-0.02em] text-ink text-balance">
            Histórico de vendas
          </h1>
          <p className="mt-0.5 text-[13px] text-muted">
            Registre cada site vendido — o dashboard soma a partir daqui
          </p>
        </div>
        {sales.length > 0 && (
          <div className="text-right">
            <p className={labelClass}>Total acumulado</p>
            <p className="mt-0.5 font-data text-[19px] font-bold tabular-nums tracking-[-0.02em] text-signal">
              {formatCurrency(total)}
            </p>
          </div>
        )}
      </header>

      <div className="mx-auto grid w-full max-w-4xl gap-[22px] px-5 pb-14 pt-6 lg:px-6">
        <section className="rounded-2xl border border-line bg-surface">
          <div className="flex items-center gap-2.5 border-b border-line-soft px-[18px] pb-3.5 pt-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-4 w-4 text-brand-2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <h2 className="font-display text-[14px] font-bold text-ink">Registrar venda</h2>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid items-end gap-2.5 px-[18px] pb-[18px] pt-4 sm:grid-cols-[minmax(0,1fr)_130px_150px_auto]"
          >
            <div className="grid gap-1.5">
              <label htmlFor="s-desc" className={labelClass}>
                Descrição
              </label>
              <input
                id="s-desc"
                type="text"
                placeholder="Site para Barbearia Dom Rocha"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                required
                className={inputClass}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="s-val" className={labelClass}>
                Valor
              </label>
              <input
                id="s-val"
                type="number"
                placeholder="745"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
                min="0"
                step="0.01"
                className={`${inputClass} font-data tabular-nums`}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="s-data" className={labelClass}>
                Data
              </label>
              <input
                id="s-data"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
                className={`${inputClass} font-data`}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="whitespace-nowrap rounded-[10px] bg-gradient-to-br from-brand-2 via-brand to-[#6d28d9] px-4 py-2.5 font-display text-[13px] font-bold text-white shadow-[0_10px_22px_-12px_rgba(139,92,246,1)] transition-all hover:-translate-y-px hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {submitting ? "Salvando..." : "Adicionar"}
            </button>
          </form>

          {error && (
            <div className="flex items-start gap-2.5 border-t border-red-500/20 bg-red-500/5 px-[18px] py-3 text-[13px] text-red-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-px h-4 w-4 shrink-0">
                <path d="M12 8v5M12 16.5v.5" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              {error}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-line-soft px-[18px] pb-3.5 pt-4">
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-brand-2">
                <path d="M4 6h16M4 12h16M4 18h10" />
              </svg>
              <h2 className="font-display text-[14px] font-bold text-ink">Vendas registradas</h2>
            </div>
            {sales.length > 0 && (
              <span className="font-data text-[11.5px] text-muted">
                {sales.length} {sales.length === 1 ? "venda" : "vendas"}
              </span>
            )}
          </div>

          {loading ? (
            <p className="px-6 py-10 text-center text-[13px] text-muted">Carregando...</p>
          ) : sales.length === 0 ? (
            <p className="px-6 py-10 text-center text-[13px] text-muted">
              Nenhuma venda registrada ainda. A primeira aparece aqui.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.label}>
                <div className="flex items-baseline justify-between gap-3 border-b border-line-soft bg-[#0a0a12] px-[18px] py-2">
                  <span className="font-data text-[9.5px] uppercase tracking-[0.14em] text-muted">
                    {group.label}
                  </span>
                  <span className="font-data text-[11.5px] font-medium tabular-nums text-ink-2">
                    {formatCurrency(group.total)}
                  </span>
                </div>

                {group.items.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between gap-3.5 border-b border-line-soft px-[18px] py-3 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {sale.description}
                      </p>
                      <p className="mt-0.5 font-data text-[11px] text-muted">
                        {new Date(sale.date + "T00:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3.5">
                      <span className="font-data text-[14px] font-bold tabular-nums text-signal">
                        {formatCurrency(Number(sale.amount))}
                      </span>
                      <button
                        onClick={() => deleteSale(sale.id)}
                        aria-label={`Excluir venda: ${sale.description}`}
                        className="rounded-md p-1 text-muted/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-3.5 w-3.5">
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
