"use client";

import Link from "next/link";
import { useSales } from "@/lib/useSales";
import {
  countSales,
  dailySeries,
  formatCurrency,
  periodFilter,
  startOfToday,
  sumSales,
} from "@/lib/sales";

function Sparkline({ points, tone }: { points: number[]; tone: "brand" | "signal" }) {
  if (points.length < 2 || points.every((p) => p === 0)) {
    return <span className="h-[26px] w-[72px] shrink-0" aria-hidden />;
  }

  const w = 72;
  const h = 26;
  const max = Math.max(...points);
  const step = w / (points.length - 1);
  const coords = points.map<[number, number]>((p, i) => [i * step, h - 2 - (p / max) * (h - 5)]);

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
  const { sales, loading } = useSales();
  const today = startOfToday();

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
            value={formatCurrency(sumSales(sales, periodFilter("hoje", today)))}
            count={countSales(sales, periodFilter("hoje", today))}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-[13px] w-[13px]">
                <path d="M12 2v20M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            }
          />
          <StatCard
            label="Ontem"
            value={formatCurrency(sumSales(sales, periodFilter("ontem", today)))}
            count={countSales(sales, periodFilter("ontem", today))}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-[13px] w-[13px]">
                <rect x="3" y="5" width="18" height="16" rx="2.5" />
                <path d="M3 10h18M8 3v4M16 3v4" />
              </svg>
            }
          />
          <StatCard
            label="Últimos 7 dias"
            value={formatCurrency(sumSales(sales, periodFilter("7d", today)))}
            count={countSales(sales, periodFilter("7d", today))}
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
            value={formatCurrency(sumSales(sales, periodFilter("30d", today)))}
            count={countSales(sales, periodFilter("30d", today))}
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
