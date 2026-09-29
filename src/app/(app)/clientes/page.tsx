"use client";

import { useCallback, useState } from "react";
import LoadingProgress from "@/components/LoadingProgress";
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
  const [searchCity, setSearchCity] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSearch = useCallback(async (values: SearchFormValues) => {
    setSearchNiche(values.niche);
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

  const withoutSite = results.filter((b) => !b.website).length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6 pt-20 lg:flex-row lg:p-8">
      <aside className="w-full shrink-0 lg:sticky lg:top-8 lg:h-fit lg:w-[280px]">
        <SearchForm onSubmit={handleSearch} isLoading={status === "loading"} />
      </aside>

      <div className="min-w-0 flex-1">
        {status === "idle" && (
          <div className="flex h-[480px] flex-col items-center justify-center rounded-2xl border border-brand/10 bg-panel/40 text-center">
            <span className="text-5xl">🔭</span>
            <p className="mt-4 text-lg font-semibold text-ink">Faça uma busca para começar</p>
            <p className="mt-1 max-w-sm px-6 text-sm text-muted">
              Preencha o nicho e a cidade na barra lateral pra encontrar negócios locais e
              identificar quem ainda não tem site.
            </p>
          </div>
        )}

        {status === "loading" && (
          <LoadingProgress messages={progressLog} percent={progressPercent} />
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {status === "done" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-ink">{results.length} negócios encontrados</span>
              <span className="text-brand">—</span>
              <span className="font-semibold text-success">{withoutSite} sem site</span>
            </div>
            <ResultsTable results={results} searchNiche={searchNiche} searchCity={searchCity} />
          </div>
        )}
      </div>
    </div>
  );
}
