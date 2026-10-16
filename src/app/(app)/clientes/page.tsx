"use client";

import Radar from "@/components/Radar";
import SearchForm from "@/components/SearchForm";
import SiteFromMapsForm from "@/components/SiteFromMapsForm";

// A busca abre o Google Maps em nova aba (ver SearchForm); o negócio encontrado lá
// é digitado no SiteFromMapsForm, que leva para /gerar-prompt. A busca pela SerpAPI
// (/api/search + ResultsTable) continua no código, só não é chamada daqui.
export default function ClientesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4 pl-16 lg:px-6 lg:pl-6">
        <div className="min-w-0">
          <h1 className="font-display text-[21px] font-bold tracking-[-0.02em] text-ink text-balance">
            Procurar Clientes
          </h1>
          <p className="mt-0.5 text-[13px] text-muted">
            Negócios locais sem site — os que mais convertem
          </p>
        </div>
      </header>

      <div className="grid gap-[22px] px-5 pb-14 pt-6 lg:grid-cols-[322px_minmax(0,1fr)] lg:items-start lg:px-6">
        <aside className="w-full min-w-0 lg:sticky lg:top-6">
          <SearchForm />
        </aside>

        <div className="grid min-w-0 gap-[22px]">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface/40 px-6 py-10 text-center">
            <Radar />
            <p className="mt-5 font-display text-[17px] font-bold text-ink">
              Faça uma busca para começar
            </p>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">
              Escolha o nicho e a cidade ao lado. O Google Maps abre em uma nova aba com os
              negócios da região — procure os que ainda não têm site e traga os dados para cá.
            </p>
          </div>

          <SiteFromMapsForm />
        </div>
      </div>
    </div>
  );
}
