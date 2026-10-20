import { dayKey, startOfToday, type Sale } from "@/lib/sales";

export type RangeKey = "hoje" | "7d" | "30d" | "3m" | "tudo";

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "3m", label: "3 meses" },
  { key: "tudo", label: "Tudo" },
];

const RANGE_DAYS: Record<Exclude<RangeKey, "tudo">, number> = {
  hoje: 1,
  "7d": 7,
  "30d": 30,
  "3m": 90,
};

/** Janela [start, end) em datas locais; `null` em start = sem limite inferior. */
export interface Window {
  start: Date | null;
  end: Date;
}

function addDays(d: Date, n: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function rangeDays(range: RangeKey) {
  return range === "tudo" ? null : RANGE_DAYS[range];
}

export function currentWindow(range: RangeKey, today = startOfToday()): Window {
  const end = addDays(today, 1);
  const days = rangeDays(range);
  return { start: days ? addDays(end, -days) : null, end };
}

/** Período imediatamente anterior, do mesmo tamanho. "Tudo" não tem comparação. */
export function previousWindow(range: RangeKey, today = startOfToday()): Window | null {
  const days = rangeDays(range);
  if (!days) return null;
  const cur = currentWindow(range, today);
  return { start: addDays(cur.end, -days * 2), end: addDays(cur.end, -days) };
}

export function inWindow(date: Date, w: Window) {
  return date < w.end && (!w.start || date >= w.start);
}

/** Variação percentual; `null` quando não há base de comparação. */
export function pctChange(current: number, previous: number | null) {
  if (previous === null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

const toDate = (isoDay: string) => new Date(isoDay + "T00:00:00");

export function salesIn(sales: Sale[], w: Window) {
  return sales.filter((s) => inWindow(toDate(s.date), w));
}

export function sumAmount(sales: Sale[]) {
  return sales.reduce((acc, s) => acc + Number(s.amount), 0);
}

export interface RevenuePoint {
  label: string;
  revenue: number;
}

/**
 * Receita por dia dentro da janela; em janelas longas ("Tudo" com muito
 * histórico) agrupa por mês pra o gráfico continuar legível.
 */
export function revenueSeries(sales: Sale[], w: Window): RevenuePoint[] {
  const inRange = salesIn(sales, w);
  const first =
    w.start ??
    (inRange.length ? new Date(Math.min(...inRange.map((s) => toDate(s.date).getTime()))) : addDays(w.end, -1));
  const spanDays = Math.max(1, Math.round((w.end.getTime() - first.getTime()) / 86_400_000));

  if (spanDays > 120) {
    const byMonth = new Map<string, number>();
    const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
    while (cursor < w.end) {
      byMonth.set(`${cursor.getFullYear()}-${cursor.getMonth()}`, 0);
      cursor.setMonth(cursor.getMonth() + 1);
    }
    for (const s of inRange) {
      const d = toDate(s.date);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      byMonth.set(k, (byMonth.get(k) ?? 0) + Number(s.amount));
    }
    return [...byMonth].map(([k, revenue]) => {
      const [y, m] = k.split("-").map(Number);
      return {
        label: new Date(y, m, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        revenue,
      };
    });
  }

  const byDay = new Map<string, number>();
  for (let d = new Date(first); d < w.end; d = addDays(d, 1)) byDay.set(dayKey(d), 0);
  for (const s of inRange) byDay.set(s.date, (byDay.get(s.date) ?? 0) + Number(s.amount));
  return [...byDay].map(([k, revenue]) => ({
    label: toDate(k).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    revenue,
  }));
}

/**
 * TODO: filtrar por período no Supabase — o produto ainda não registra
 * assinaturas, então estes números são mockados (determinísticos, pra não
 * "pular" a cada render) e só escalam com o tamanho do período.
 */
export function mockSubscriptions(range: RangeKey, today = startOfToday()) {
  const days = rangeDays(range);
  const active = 128 - (today.getDate() % 3);
  if (!days) return { created: 214, createdPrev: null, active, activeAtStart: null };
  const created = Math.max(1, Math.round(days * 0.7));
  const createdPrev = Math.max(1, Math.round(days * 0.62));
  // "Ativos" é um retrato de agora; o que muda com o período é o saldo
  // (novas − cancelamentos) desde o início dele.
  const net = created - Math.round(created * 0.25);
  return { created, createdPrev, active, activeAtStart: active - net };
}
