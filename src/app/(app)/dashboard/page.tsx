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

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Chave local YYYY-MM-DD. toISOString() usaria UTC e jogaria vendas
// da noite para o dia seguinte.
function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sumSales(sales: Sale[], filterFn: (date: Date) => boolean) {
  return sales
    .filter((s) => filterFn(new Date(s.date + "T00:00:00")))
    .reduce((acc, s) => acc + Number(s.amount), 0);
}

function countSales(sales: Sale[], filterFn: (date: Date) => boolean) {
  return sales.filter((s) => filterFn(new Date(s.date + "T00:00:00"))).length;
}

/** Receita por dia nos últimos `days` dias, do mais antigo ao mais recente. */
function dailySeries(sales: Sale[], days: number, today: Date) {
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    out.push(
      sales.filter((s) => s.date === key).reduce((acc, s) => acc + Number(s.amount), 0),
    );
  }
  return out;
}

function Sparkline({ points, tone }: { points: number[]; tone: "brand" | "signal" }) {
  if (points.length < 2 || points.every((p) => p === 0)) {
    return <span className="h-[26px] w-[72px] shrink-0" aria-hidden />;
  }

  const w = 72;
  const h = 26;
  const max = Math.max(...points);
  const step = w / (points.length - 1);
  const coords = points.map<[number, number]>((p, i) => [
    i * step,
    h - 2 - (p / max) * (h - 5),
  ]);

  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const [lastX, lastY] = coords[coords.length - 1];

  const stroke = tone === "signal" ? "#22d3a5" : "#c084fc";
  const fill = tone === "signal" ? "rgba(34,211,165,.14)" : "rgba(139,92,246,.18)";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
      className="h-[26px] w-[72px] shrink-0 opacity-90"
    >
      <path d={area} fill={fill} />
      <path d={line} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.6" fill={stroke} />
    </svg>
  );
}

function StatCard({
  label,
  value,
  count,
  lead = false,
  series,
  tone = "brand",
  icon,
}: {
  label: string;
  value: string;
  count: number;
  lead?: boolean;
  series?: number[];
  tone?: "brand" | "signal";
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`relative grid gap-2.5 overflow-hidden rounded-[14px] border bg-surface px-4 py-[15px] ${
        lead ? "border-brand/[0.34]" : "border-line"
      }`}
    >
      {lead && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_100%_0%,rgba(139,92,246,0.16),transparent_62%)]"
        />
      )}
      <p className="relative flex items-center gap-[7px] font-data text-[9.5px] uppercase tracking-[0.14em] text-muted">
        <span className="opacity-70">{icon}</span>
        {label}
      </p>
      <p className="relative font-data text-[25px] font-bold leading-none tracking-[-0.025em] tabular-nums text-ink">
        {value}
      </p>
      <div className="relative flex items-end justify-between gap-2.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-[7px] py-0.5 font-data text-[10.5px] font-medium ${
            count > 0 ? "bg-signal/10 text-signal" : "bg-white/[0.04] text-muted"
          }`}
        >
          {count > 0 ? "▲" : "—"} {count} {count === 1 ? "site" : "sites"}
        </span>
        {series ? <Sparkline points={series} tone={tone} /> : <span className="h-[26px]" />}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: dayKey(new Date()),
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
    setForm({ description: "", amount: "", date: dayKey(new Date()) });
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

  const isToday = (d: Date) => d >= today;
  const isYesterday = (d: Date) => d >= yesterday && d < today;
  const is7 = (d: Date) => d >= last7;
  const is30 = (d: Date) => d >= last30;

  const labelClass = "font-data text-[9.5px] uppercase tracking-[0.14em] text-muted";
  const inputClass =
    "w-full rounded-[10px] border border-line bg-[#0a0a12] px-3 py-2.5 text-[13.5px] text-ink outline-none transition-all placeholder:text-[#565270] focus:border-brand/60 focus:ring-[3px] focus:ring-brand/15";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4 pl-16 lg:px-6 lg:pl-6">
        <div className="min-w-0">
          <h1 className="font-display text-[21px] font-bold tracking-[-0.02em] text-ink text-balance">
            Dashboard de Vendas
          </h1>
          <p className="mt-0.5 text-[13px] text-muted">Sites vendidos e receita por período</p>
        </div>
        <span className="inline-flex items-center gap-2.5 rounded-full border border-signal/[0.28] bg-signal/[0.07] py-[7px] pl-[9px] pr-[13px] font-data text-[10.5px] uppercase tracking-[0.1em] text-signal">
          <span className="radar-sweep relative h-[15px] w-[15px] shrink-0 overflow-hidden rounded-full border border-signal/40" />
          Sincronizado
        </span>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-[22px] px-5 pb-14 pt-6 lg:px-6">
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            lead
            label="Hoje"
            value={formatCurrency(sumSales(sales, isToday))}
            count={countSales(sales, isToday)}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-[13px] w-[13px]">
                <path d="M12 2v20M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            }
          />
          <StatCard
            label="Ontem"
            value={formatCurrency(sumSales(sales, isYesterday))}
            count={countSales(sales, isYesterday)}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-[13px] w-[13px]">
                <rect x="3" y="5" width="18" height="16" rx="2.5" />
                <path d="M3 10h18M8 3v4M16 3v4" />
              </svg>
            }
          />
          <StatCard
            label="Últimos 7 dias"
            value={formatCurrency(sumSales(sales, is7))}
            count={countSales(sales, is7)}
            series={dailySeries(sales, 7, today)}
            tone="signal"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[13px] w-[13px]">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3.5 2" />
              </svg>
            }
          />
          <StatCard
            label="Últimos 30 dias"
            value={formatCurrency(sumSales(sales, is30))}
            count={countSales(sales, is30)}
            series={dailySeries(sales, 30, today)}
            tone="signal"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[13px] w-[13px]">
                <path d="M3 17l6-6 4 4 8-8" />
                <path d="M21 7v5h-5" />
              </svg>
            }
          />
        </div>

        <section className="rounded-2xl border border-line bg-surface">
          <div className="flex items-center gap-2.5 border-b border-line-soft px-[18px] pb-3.5 pt-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-4 w-4 text-brand-2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <h2 className="font-display text-[14px] font-bold text-ink">Registrar venda</h2>
          </div>
          <form
            onSubmit={handleAddSale}
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
        </section>

        <section className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex items-center gap-2.5 border-b border-line-soft px-[18px] pb-3.5 pt-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-brand-2">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
            <h2 className="font-display text-[14px] font-bold text-ink">Histórico de vendas</h2>
          </div>

          {loading ? (
            <p className="px-6 py-10 text-center text-[13px] text-muted">Carregando...</p>
          ) : sales.length === 0 ? (
            <p className="px-6 py-10 text-center text-[13px] text-muted">
              Nenhuma venda registrada ainda.
            </p>
          ) : (
            <div>
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between gap-3.5 border-b border-line-soft px-[18px] py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">{sale.description}</p>
                    <p className="mt-0.5 font-data text-[11px] text-muted">
                      {new Date(sale.date + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3.5">
                    <span className="font-data text-[14px] font-bold tabular-nums text-signal">
                      {formatCurrency(Number(sale.amount))}
                    </span>
                    <button
                      onClick={() => handleDelete(sale.id)}
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
          )}
        </section>
      </div>
    </div>
  );
}
