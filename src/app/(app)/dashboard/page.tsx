"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSales } from "@/lib/useSales";
import { useGeneratedSites } from "@/lib/useGeneratedSites";
import { formatCurrency, startOfToday } from "@/lib/sales";
import {
  RANGE_OPTIONS,
  currentWindow,
  inWindow,
  mockSubscriptions,
  pctChange,
  previousWindow,
  revenueSeries,
  salesIn,
  sumAmount,
  type RangeKey,
} from "@/lib/dashboardPeriod";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-[18px] w-[18px]",
} as const;

const ICONS = {
  revenue: (
    <svg {...iconProps}>
      <path d="M12 2v20M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  subs: (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M18 8v6M15 11h6" />
    </svg>
  ),
  sites: (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M7 6.5h.01M10 6.5h.01" />
    </svg>
  ),
  active: (
    <svg {...iconProps}>
      <path d="M16 20v-1.5a4 4 0 00-4-4H7a4 4 0 00-4 4V20M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1.5a4 4 0 00-3-3.9M16 4.2a3.5 3.5 0 010 6.6" />
    </svg>
  ),
};

function Delta({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="font-data text-[11px] text-muted">sem comparação</span>;
  }
  const positive = value >= 0;
  return (
    <span className="inline-flex items-center gap-1.5 font-data text-[11px]">
      <span
        className={`rounded-full px-[7px] py-0.5 font-medium ${
          positive ? "bg-signal/10 text-signal" : "bg-red-500/10 text-red-400"
        }`}
      >
        {positive ? "+" : ""}
        {value.toFixed(0)}%
      </span>
      <span className="text-muted">vs período anterior</span>
    </span>
  );
}

function StatCard({
  label,
  value,
  delta,
  icon,
  lead = false,
}: {
  label: string;
  value: string;
  delta: number | null;
  icon: React.ReactNode;
  lead?: boolean;
}) {
  return (
    <div
      className={`relative grid gap-3 overflow-hidden rounded-2xl border bg-surface p-5 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.8)] ${
        lead ? "border-brand/[0.34]" : "border-line"
      }`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_100%_0%,rgba(139,92,246,0.10),transparent_62%)]"
      />
      <div className="relative flex items-center justify-between gap-3">
        <p className="font-data text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-brand/25 bg-brand/10 text-brand-2">
          {icon}
        </span>
      </div>
      <p className="relative font-data text-[28px] font-bold leading-none tracking-[-0.025em] tabular-nums text-ink">
        {value}
      </p>
      <div className="relative">
        <Delta value={delta} />
      </div>
    </div>
  );
}

function PeriodFilter({ value, onChange }: { value: RangeKey; onChange: (r: RangeKey) => void }) {
  return (
    <div role="group" aria-label="Período" className="flex flex-wrap gap-1.5 rounded-2xl border border-line bg-surface p-1.5">
      {RANGE_OPTIONS.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.key)}
            className={`rounded-xl px-3.5 py-2 font-display text-[13px] font-semibold transition-colors ${
              active
                ? "bg-gradient-to-br from-brand-2 via-brand to-[#6d28d9] text-white shadow-[0_8px_18px_-10px_rgba(139,92,246,1)]"
                : "text-muted hover:bg-white/[0.04] hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function RevenueChart({ data }: { data: { label: string; revenue: number }[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#231f38" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#84809e", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis
            tick={{ fill: "#84809e", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) => `R$ ${v}`}
          />
          <Tooltip
            cursor={{ stroke: "#c084fc", strokeOpacity: 0.3 }}
            contentStyle={{
              background: "#151521",
              border: "1px solid #231f38",
              borderRadius: 12,
              fontSize: 12,
              color: "#f4f3ff",
            }}
            labelStyle={{ color: "#84809e" }}
            formatter={(v) => [formatCurrency(Number(v)), "Receita"]}
          />
          <Area type="monotone" dataKey="revenue" stroke="#c084fc" strokeWidth={2} fill="url(#revFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardPage() {
  const { sales, loading } = useSales();
  const { dates: siteDates } = useGeneratedSites();
  const [range, setRange] = useState<RangeKey>("30d");

  const m = useMemo(() => {
    const today = startOfToday();
    const cur = currentWindow(range, today);
    const prev = previousWindow(range, today);

    const revenue = sumAmount(salesIn(sales, cur));
    const revenuePrev = prev ? sumAmount(salesIn(sales, prev)) : null;
    const sitesCount = siteDates.filter((d) => inWindow(d, cur)).length;
    const sitesPrev = prev ? siteDates.filter((d) => inWindow(d, prev)).length : null;
    const subs = mockSubscriptions(range, today);

    return {
      revenue,
      revenueDelta: pctChange(revenue, revenuePrev),
      sitesCount,
      sitesDelta: pctChange(sitesCount, sitesPrev),
      subs,
      subsDelta: pctChange(subs.created, subs.createdPrev),
      series: revenueSeries(sales, cur),
    };
  }, [sales, siteDates, range]);

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
        <PeriodFilter value={range} onChange={setRange} />

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard lead label="Receita total" value={formatCurrency(m.revenue)} delta={m.revenueDelta} icon={ICONS.revenue} />
          {/* TODO: filtrar por período no Supabase (assinaturas ainda mockadas) */}
          <StatCard label="Novas assinaturas" value={String(m.subs.created)} delta={m.subsDelta} icon={ICONS.subs} />
          <StatCard label="Sites gerados" value={String(m.sitesCount)} delta={m.sitesDelta} icon={ICONS.sites} />
          {/* TODO: filtrar por período no Supabase (assinantes ativos mockado) */}
          <StatCard label="Assinantes ativos" value={String(m.subs.active)} delta={null} icon={ICONS.active} />
        </div>

        <section className="rounded-2xl border border-line bg-surface p-5 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.8)]">
          <h2 className="mb-4 font-display text-[15px] font-bold text-ink">Receita no período</h2>
          <RevenueChart data={m.series} />
        </section>

        {!loading && sales.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface/40 px-6 py-12 text-center">
            <p className="font-display text-[15px] font-bold text-ink">
              Nenhuma venda registrada ainda
            </p>
            <p className="max-w-md text-[13px] leading-relaxed text-muted">
              Os números acima começam a se mover assim que você registrar a primeira venda.
            </p>
            <Link
              href="/historico"
              className="mt-1 inline-flex items-center gap-2 rounded-[10px] bg-gradient-to-br from-brand-2 via-brand to-[#6d28d9] px-4 py-2.5 font-display text-[13px] font-bold text-white shadow-[0_10px_22px_-12px_rgba(139,92,246,1)] transition-all hover:-translate-y-px hover:brightness-110"
            >
              Registrar venda
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
