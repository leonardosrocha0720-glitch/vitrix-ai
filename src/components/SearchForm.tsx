"use client";

import { useState } from "react";
import RatingRangeSlider from "@/components/RatingRangeSlider";
import type { SearchFormValues, SiteFilter } from "@/types/business";

interface SearchFormProps {
  onSubmit: (values: SearchFormValues) => void;
  isLoading: boolean;
}

const DEFAULT_VALUES: SearchFormValues = {
  niche: "",
  city: "",
  state: "",
  minRating: 3.5,
  maxRating: 4.5,
  minReviews: 10,
  siteFilter: "all",
  maxResults: 20,
};

const SITE_FILTER_OPTIONS: { value: SiteFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "no-site", label: "Sem site" },
  { value: "with-site", label: "Com site" },
];

const RESULT_OPTIONS = [10, 20, 30, 50];

const TIPS = [
  "Combine nicho + cidade específica para achar leads mais qualificados.",
  "Negócios com poucas avaliações e sem site costumam ser os mais fáceis de converter.",
  "Use os filtros avançados pra refinar por nota e número de avaliações.",
];

const inputClass =
  "w-full rounded-lg border border-brand/15 bg-panel-2 px-3 py-2.5 text-sm text-ink placeholder:text-muted/50 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
  const [values, setValues] = useState<SearchFormValues>(DEFAULT_VALUES);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const canSubmit = values.niche.trim().length > 0 && values.city.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;
    onSubmit(values);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-brand/15 bg-panel p-5 shadow-lg shadow-black/20"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">🔍</span>
        <h2 className="text-base font-bold text-ink">Nova Prospecção</h2>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="niche" className="text-xs font-medium text-muted">
          Nicho de negócio
        </label>
        <input
          id="niche"
          type="text"
          required
          placeholder="Ex: dentista, restaurante..."
          value={values.niche}
          onChange={(e) => setValues((v) => ({ ...v, niche: e.target.value }))}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="city" className="text-xs font-medium text-muted">
          Cidade
        </label>
        <input
          id="city"
          type="text"
          required
          placeholder="Ex: Ribeirão Preto"
          value={values.city}
          onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="state" className="text-xs font-medium text-muted">
          Estado (opcional)
        </label>
        <input
          id="state"
          type="text"
          placeholder="Ex: SP"
          value={values.state}
          onChange={(e) => setValues((v) => ({ ...v, state: e.target.value }))}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="maxResults" className="text-xs font-medium text-muted">
          Quantidade de resultados
        </label>
        <select
          id="maxResults"
          value={values.maxResults}
          onChange={(e) => setValues((v) => ({ ...v, maxResults: Number(e.target.value) }))}
          className={inputClass}
        >
          {RESULT_OPTIONS.map((n) => (
            <option key={n} value={n} className="bg-panel-2 text-ink">
              {n} resultados
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((s) => !s)}
        className="flex items-center justify-between text-xs font-medium text-muted transition-colors hover:text-ink"
      >
        Filtros avançados
        <span className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}>▾</span>
      </button>

      {showAdvanced && (
        <div className="flex flex-col gap-4 rounded-xl border border-brand/10 bg-panel-2/60 p-3">
          <RatingRangeSlider
            min={values.minRating}
            max={values.maxRating}
            onChange={(minRating, maxRating) => setValues((v) => ({ ...v, minRating, maxRating }))}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="minReviews" className="text-xs font-medium text-muted">
              Número mínimo de avaliações
            </label>
            <input
              id="minReviews"
              type="number"
              min={0}
              value={values.minReviews}
              onChange={(e) =>
                setValues((v) => ({ ...v, minReviews: Math.max(0, Number(e.target.value)) }))
              }
              className="w-full rounded-lg border border-brand/15 bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Filtrar por site</span>
            <div className="inline-flex rounded-lg border border-brand/15 bg-panel p-1">
              {SITE_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValues((v) => ({ ...v, siteFilter: opt.value }))}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    values.siteFilter === opt.value
                      ? "bg-brand text-white"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || isLoading}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-hover px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Buscando negócios...
          </>
        ) : (
          <>🚀 Iniciar Prospecção</>
        )}
      </button>

      <div className="h-px bg-brand/10" />

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted">Dicas rápidas</p>
        <ul className="flex flex-col gap-1.5">
          {TIPS.map((tip) => (
            <li key={tip} className="flex gap-1.5 text-xs leading-relaxed text-muted/80">
              <span className="text-brand">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
