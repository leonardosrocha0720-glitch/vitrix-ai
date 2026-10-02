"use client";

import { useState } from "react";
import RatingRangeSlider from "@/components/RatingRangeSlider";
import { NICHES } from "@/lib/niches";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/countries";
import type { SearchFormValues, SiteFilter } from "@/types/business";

interface SearchFormProps {
  onSubmit: (values: SearchFormValues) => void;
  isLoading: boolean;
}

const DEFAULT_VALUES: SearchFormValues = {
  niche: "",
  nicheId: "",
  country: DEFAULT_COUNTRY,
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
  "Nota alta com poucas avaliações indica negócio bom e pouco visível — o argumento de venda já vem pronto.",
  "Sem site e com WhatsApp é o par ideal: dá pra mandar o preview no mesmo dia.",
  "Cidade específica rende mais que região ampla. O dono reconhece a rua no site gerado.",
];

const labelClass = "font-data text-[9.5px] uppercase tracking-[0.14em] text-muted";

const inputClass =
  "w-full rounded-[10px] border border-line bg-[#0a0a12] px-3 py-2.5 text-[13.5px] text-ink outline-none transition-all placeholder:text-[#565270] focus:border-brand/60 focus:ring-[3px] focus:ring-brand/15";

export default function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
  const [values, setValues] = useState<SearchFormValues>(DEFAULT_VALUES);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showNicheError, setShowNicheError] = useState(false);

  // O nicho fica fora do disabled do botão para a mensagem de erro poder aparecer
  const canSubmit = values.city.trim().length > 0;
  const isBrazil = values.country === DEFAULT_COUNTRY;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;
    const niche = values.niche.trim();
    if (!niche) {
      setShowNicheError(true);
      return;
    }
    onSubmit({ ...values, niche });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_20px_44px_-34px_#000]"
    >
      <div className="flex items-center gap-2.5 border-b border-line-soft px-[18px] pb-3.5 pt-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-brand-2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.2-3.2" />
        </svg>
        <h2 className="font-display text-[14px] font-bold tracking-[-0.005em] text-ink">
          Nova prospecção
        </h2>
      </div>

      <div className="grid gap-3.5 px-[18px] pb-[18px] pt-4">
        <div className="grid gap-1.5">
          <span id="niche-label" className={labelClass}>
            Nicho de negócio
          </span>
          <div role="group" aria-labelledby="niche-label" className="flex flex-wrap gap-1.5">
            {NICHES.map((niche) => {
              const isSelected = values.nicheId === niche.id;
              return (
                <button
                  key={niche.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setValues((v) => ({ ...v, nicheId: niche.id, niche: niche.searchTerm }));
                    setShowNicheError(false);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-all ${
                    isSelected
                      ? "border-brand bg-brand/[0.16] text-ink shadow-[0_0_0_1px_var(--color-brand),0_0_18px_-8px_var(--color-brand)]"
                      : "border-line bg-[#0a0a12] text-ink-2 hover:border-brand/50 hover:text-ink"
                  }`}
                >
                  <span aria-hidden>{niche.emoji}</span>
                  {niche.label}
                </button>
              );
            })}
          </div>
          {/* Nicho livre: sem nicheId, o texto vira o termo de busca. Chip e texto
              se excluem — o campo só mostra valor quando nenhum chip está ativo. */}
          <label htmlFor="custom-niche" className={`${labelClass} mt-1.5`}>
            Outro nicho
          </label>
          <input
            id="custom-niche"
            type="text"
            placeholder="Ex: pet shop, farmácia, ótica…"
            value={values.nicheId ? "" : values.niche}
            onChange={(e) => {
              const text = e.target.value;
              setValues((v) => ({ ...v, nicheId: "", niche: text }));
              if (text.trim()) setShowNicheError(false);
            }}
            className={inputClass}
          />
          {showNicheError && (
            <span role="alert" className="text-[11.5px] text-red-300">
              Selecione ou digite um nicho para buscar.
            </span>
          )}
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="country" className={labelClass}>
            País
          </label>
          <div className="relative">
            <select
              id="country"
              value={values.country}
              onChange={(e) => {
                const country = e.target.value;
                // UF só existe no Brasil: limpa ao trocar para não vazar pra busca
                setValues((v) => ({
                  ...v,
                  country,
                  state: country === DEFAULT_COUNTRY ? v.state : "",
                }));
              }}
              className={`${inputClass} cursor-pointer appearance-none pr-9 [color-scheme:dark]`}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        <div className={`grid gap-2.5 ${isBrazil ? "grid-cols-[1fr_92px]" : ""}`}>
          <div className="grid gap-1.5">
            <label htmlFor="city" className={labelClass}>
              Cidade
            </label>
            <input
              id="city"
              type="text"
              required
              placeholder="Guarapuava"
              value={values.city}
              onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))}
              className={inputClass}
            />
          </div>

          {isBrazil && (
            <div className="grid gap-1.5">
              <label htmlFor="state" className={labelClass}>
                UF
              </label>
              <input
                id="state"
                type="text"
                placeholder="PR"
                value={values.state}
                onChange={(e) => setValues((v) => ({ ...v, state: e.target.value }))}
                className={inputClass}
              />
            </div>
          )}
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="maxResults" className={labelClass}>
            Resultados
          </label>
          <select
            id="maxResults"
            value={values.maxResults}
            onChange={(e) => setValues((v) => ({ ...v, maxResults: Number(e.target.value) }))}
            className={inputClass}
          >
            {RESULT_OPTIONS.map((n) => (
              <option key={n} value={n} className="bg-surface-2 text-ink">
                {n} resultados
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="flex items-center justify-between font-data text-[9.5px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
        >
          Filtros avançados
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="grid gap-4 rounded-xl border border-line-soft bg-[#0a0a12] p-3">
            <RatingRangeSlider
              min={values.minRating}
              max={values.maxRating}
              onChange={(minRating, maxRating) => setValues((v) => ({ ...v, minRating, maxRating }))}
            />

            <div className="grid gap-1.5">
              <label htmlFor="minReviews" className={labelClass}>
                Mínimo de avaliações
              </label>
              <input
                id="minReviews"
                type="number"
                min={0}
                value={values.minReviews}
                onChange={(e) =>
                  setValues((v) => ({ ...v, minReviews: Math.max(0, Number(e.target.value)) }))
                }
                className={`${inputClass} font-data tabular-nums`}
              />
            </div>

            <div className="grid gap-1.5">
              <span className={labelClass}>Filtrar por site</span>
              <div className="inline-flex rounded-[10px] border border-line bg-surface p-1">
                {SITE_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValues((v) => ({ ...v, siteFilter: opt.value }))}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                      values.siteFilter === opt.value
                        ? "bg-gradient-to-br from-brand-2 to-brand text-white shadow-[0_6px_14px_-8px_rgba(139,92,246,1)]"
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
          className="mt-1 flex w-full items-center justify-center gap-2.5 rounded-[11px] bg-gradient-to-br from-brand-2 via-brand to-[#6d28d9] px-4 py-3 font-display text-[13.5px] font-bold tracking-[0.01em] text-white shadow-[0_0_0_1px_rgba(192,132,252,0.3),0_12px_26px_-12px_rgba(139,92,246,1)] transition-all hover:-translate-y-px hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(192,132,252,0.5),0_18px_34px_-14px_rgba(139,92,246,1)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Varrendo a cidade...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M12 19V5" />
                <path d="M5 12l7-7 7 7" />
              </svg>
              Iniciar prospecção
            </>
          )}
        </button>

        <div className="grid gap-2 border-t border-line-soft pt-3">
          <p className="font-data text-[9.5px] uppercase tracking-[0.14em] text-muted">
            Leitura rápida
          </p>
          {TIPS.map((tip) => (
            <p key={tip} className="flex gap-2 text-[12.5px] leading-[1.55] text-ink-2">
              <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand" />
              {tip}
            </p>
          ))}
        </div>
      </div>
    </form>
  );
}
