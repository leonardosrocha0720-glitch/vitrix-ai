"use client";

import { useCallback, useState } from "react";
import LoadingProgress from "@/components/LoadingProgress";
import Radar from "@/components/Radar";
import ResultsTable from "@/components/ResultsTable";
import SearchForm from "@/components/SearchForm";
import type { Business, SearchEvent, SearchFormValues } from "@/types/business";

type Status = "idle" | "loading" | "done" | "error";

export default function ClientesPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [results, setResults] = useState<Business[]>([]);
  const [searchNiche, setSearchNiche] = useState("");
  const [searchNicheId, setSearchNicheId] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSearch = useCallback(async (values: SearchFormValues) => {
    setSearchNiche(values.niche);
    setSearchNicheId(values.nicheId);
    setSearchCity(values.city);
    setStatus("loading");
    setResults([]);
    setErrorMessage("");
    setProgressLog(["Iniciando busca..."]);
    setProgressPercent(5);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.body) {
        throw new Error("Resposta do servidor sem corpo de dados.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as SearchEvent;

          if (event.type === "progress") {
            setProgressLog((prev) => [...prev, event.message]);
            setProgressPercent((prev) =>
              event.page < 0 ? 95 : Math.min(90, Math.max(prev, (event.page + 1) * 25)),
            );
          } else if (event.type === "done") {
            const limited = event.results.slice(0, values.maxResults);
            setResults(limited);
            setProgressLog((prev) => [...prev, `${limited.length} negócios encontrados!`]);
            setProgressPercent(100);
            setStatus("done");
          } else if (event.type === "error") {
            setErrorMessage(event.message);
            setStatus("error");
          }
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro inesperado ao buscar negócios.");
      setStatus("error");
    }
  }, []);

  const scan =
    status === "loading"
      ? { label: "Varrendo a cidade", tone: "brand" as const }
      : status === "done"
        ? { label: "Varredura concluída", tone: "signal" as const }
        : { label: "Aguardando busca", tone: "muted" as const };

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

        <span
          className={`inline-flex items-center gap-2.5 rounded-full border py-[7px] pl-[9px] pr-[13px] font-data text-[10.5px] uppercase tracking-[0.1em] ${
            scan.tone === "signal"
              ? "border-signal/[0.28] bg-signal/[0.07] text-signal"
              : scan.tone === "brand"
                ? "border-brand/30 bg-brand/[0.08] text-brand-2"
                : "border-line bg-white/[0.02] text-muted"
          }`}
        >
          <span
            className={`relative h-[15px] w-[15px] shrink-0 overflow-hidden rounded-full border ${
              scan.tone === "signal"
                ? "radar-sweep border-signal/40"
                : scan.tone === "brand"
                  ? "radar-sweep radar-sweep-lg border-brand/40"
                  : "border-line"
            }`}
          />
          {scan.label}
        </span>
      </header>

      <div className="grid gap-[22px] px-5 pb-14 pt-6 lg:grid-cols-[322px_minmax(0,1fr)] lg:items-start lg:px-6">
        <aside className="w-full min-w-0 lg:sticky lg:top-6">
          <SearchForm onSubmit={handleSearch} isLoading={status === "loading"} />
        </aside>

        <div className="min-w-0">
          {status === "idle" && (
            <div className="flex h-[460px] flex-col items-center justify-center rounded-2xl border border-line bg-surface/40 px-6 text-center">
              <Radar />
              <p className="mt-5 font-display text-[17px] font-bold text-ink">
                Faça uma busca para começar
              </p>
              <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">
                Escolha o nicho e a cidade ao lado. A varredura devolve os negócios da região e
                marca quem ainda não tem site.
              </p>
            </div>
          )}

          {status === "loading" && (
            <LoadingProgress messages={progressLog} percent={progressPercent} />
          )}

          {status === "error" && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-[13px] text-red-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-px h-4 w-4 shrink-0">
                <path d="M12 8v5M12 16.5v.5" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              {errorMessage}
            </div>
          )}

          {status === "done" && (
            <ResultsTable
              results={results}
              searchNiche={searchNiche}
              searchCity={searchCity}
              nicheId={searchNicheId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
