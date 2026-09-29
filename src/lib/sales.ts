/**
 * Fonte única da verdade sobre vendas: tipo, formatação e as janelas de
 * tempo. Dashboard e Histórico consomem daqui — se cada tela tivesse a
 * própria conta, elas divergiriam na primeira alteração.
 */

export interface Sale {
  id: string;
  description: string;
  amount: number;
  date: string;
  created_at: string;
}

export function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Chave local YYYY-MM-DD. toISOString() trabalha em UTC e jogaria uma venda
 * registrada à noite para o dia seguinte.
 */
export function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Meia-noite de hoje, no fuso local. */
export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(from: Date, n: number) {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d;
}

export type Period = "hoje" | "ontem" | "7d" | "30d";

/** Cada período vira um teste sobre a data da venda. */
export function periodFilter(period: Period, today = startOfToday()) {
  const yesterday = daysAgo(today, 1);
  const last7 = daysAgo(today, 7);
  const last30 = daysAgo(today, 30);

  switch (period) {
    case "hoje":
      return (d: Date) => d >= today;
    case "ontem":
      return (d: Date) => d >= yesterday && d < today;
    case "7d":
      return (d: Date) => d >= last7;
    case "30d":
      return (d: Date) => d >= last30;
  }
}

function saleDate(sale: Sale) {
  return new Date(sale.date + "T00:00:00");
}

export function sumSales(sales: Sale[], match: (date: Date) => boolean) {
  return sales.filter((s) => match(saleDate(s))).reduce((acc, s) => acc + Number(s.amount), 0);
}

export function countSales(sales: Sale[], match: (date: Date) => boolean) {
  return sales.filter((s) => match(saleDate(s))).length;
}

/** Receita por dia nos últimos `days` dias, do mais antigo ao mais recente. */
export function dailySeries(sales: Sale[], days: number, today = startOfToday()) {
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(daysAgo(today, i));
    out.push(sales.filter((s) => s.date === key).reduce((acc, s) => acc + Number(s.amount), 0));
  }
  return out;
}
