"use client";

import { useState } from "react";
import BrazilStateCity from "@/components/BrazilStateCity";

// A busca não passa mais pela SerpAPI: o formulário monta a URL do Google Maps
// e abre em nova aba. /api/search continua no código, só não é chamada daqui.

export const NICHE_OPTIONS = [
  "Restaurante",
  "Hamburguer",
  "Pizza",
  "Barbearia",
  "Academia",
  "Clínica",
  "Advocacia",
  "Imobiliária",
  "Pet Shop",
  "Mecânica",
] as const;

export const OTHER_NICHE = "Outro";

const COUNTRY_OPTIONS = ["Brasil", "Portugal", "EUA"] as const;

interface MapsSearchValues {
  niche: string;
  customNiche: string; // usado só quando o nicho é "Outro"
  businessType: string;
  country: (typeof COUNTRY_OPTIONS)[number];
  state: string;
  city: string;
}

const DEFAULT_VALUES: MapsSearchValues = {
  niche: "",
  customNiche: "",
  businessType: "",
  country: "Brasil",
  state: "",
  city: "",
};

/** Ex.: barbearia, Guarapuava, Paraná, Brasil → .../maps/search/barbearia+em+Guarapuava+Paran%C3%A1+Brasil */
export function buildMapsSearchUrl({
  niche,
  businessType,
  city,
  state,
  country,
}: {
  niche: string;
  businessType?: string;
  city: string;
  state?: string;
  country?: string;
}): string {
  const parts = [businessType, niche.toLowerCase(), "em", city, state, country]
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p))
    .map(encodeURIComponent);
  return `https://www.google.com/maps/search/${parts.join("+")}`;
}

const TIPS = [
  "Nota alta com poucas avaliações indica negócio bom e pouco visível — o argumento de venda já vem pronto.",
  "Sem site e com WhatsApp é o par ideal: dá pra mandar o preview no mesmo dia.",
  "Cidade específica rende mais que região ampla. O dono reconhece a rua no site gerado.",
];

export const labelClass = "font-data text-[9.5px] uppercase tracking-[0.14em] text-muted";

export const inputClass =
  "w-full rounded-[10px] border border-line bg-[#0a0a12] px-3 py-2.5 text-[13.5px] text-ink outline-none transition-all placeholder:text-[#565270] focus:border-brand/60 focus:ring-[3px] focus:ring-brand/15";

export const selectClass = `${inputClass} cursor-pointer appearance-none pr-9 [color-scheme:dark]`;

export function SelectChevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** Select de nicho com "Outro" abrindo um campo livre. Compartilhado com o formulário de site. */
export function NicheSelect({
  id,
  niche,
  customNiche,
  onNicheChange,
  onCustomNicheChange,
  error,
}: {
  id: string;
  niche: string;
  customNiche: string;
  onNicheChange: (value: string) => void;
  onCustomNicheChange: (value: string) => void;
  /** Mensagem de erro; vazio esconde. */
  error?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className={labelClass}>
        Nicho
      </label>
      <div className="relative">
        <select
          id={id}
          value={niche}
          onChange={(e) => onNicheChange(e.target.value)}
          className={`${selectClass} ${niche ? "" : "text-[#565270]"}`}
        >
          <option value="" disabled>
            Selecione um nicho
          </option>
          {[...NICHE_OPTIONS, OTHER_NICHE].map((n) => (
            <option key={n} value={n} className="bg-surface-2 text-ink">
              {n}
            </option>
          ))}
        </select>
        <SelectChevron />
      </div>

      {niche === OTHER_NICHE && (
        <input
          type="text"
          aria-label="Qual nicho?"
          placeholder="Qual nicho? Ex: farmácia, ótica…"
          value={customNiche}
          onChange={(e) => onCustomNicheChange(e.target.value)}
          className={`${inputClass} mt-1`}
        />
      )}

      {error && (
        <span role="alert" className="text-[11.5px] text-red-300">
          {error}
        </span>
      )}
    </div>
  );
}

export default function SearchForm() {
  const [values, setValues] = useState<MapsSearchValues>(DEFAULT_VALUES);
  const [showNicheError, setShowNicheError] = useState(false);

  const isOther = values.niche === OTHER_NICHE;
  const niche = (isOther ? values.customNiche : values.niche).trim();
  const canSubmit = values.city.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (!niche) {
      setShowNicheError(true);
      return;
    }
    const url = buildMapsSearchUrl({
      niche,
      businessType: values.businessType,
      city: values.city,
      state: values.state,
      country: values.country,
    });
    window.open(url, "_blank");
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
        <NicheSelect
          id="niche"
          niche={values.niche}
          customNiche={values.customNiche}
          onNicheChange={(next) => {
            setValues((v) => ({ ...v, niche: next }));
            if (next && next !== OTHER_NICHE) setShowNicheError(false);
          }}
          onCustomNicheChange={(text) => {
            setValues((v) => ({ ...v, customNiche: text }));
            if (text.trim()) setShowNicheError(false);
          }}
          error={
            showNicheError
              ? isOther
                ? "Digite o nicho que quer buscar."
                : "Selecione um nicho para buscar."
              : ""
          }
        />

        <div className="grid gap-1.5">
          <label htmlFor="business-type" className={labelClass}>
            Tipo de negócio <span className="normal-case tracking-normal text-[#565270]">(opcional)</span>
          </label>
          <input
            id="business-type"
            type="text"
            placeholder="Ex: sem site, pequeno, recém aberto"
            value={values.businessType}
            onChange={(e) => setValues((v) => ({ ...v, businessType: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="country" className={labelClass}>
            País
          </label>
          <div className="relative">
            <select
              id="country"
              value={values.country}
              onChange={(e) =>
                setValues((v) => ({ ...v, country: e.target.value as MapsSearchValues["country"], state: "", city: "" }))
              }
              className={selectClass}
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c} value={c} className="bg-surface-2 text-ink">
                  {c}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>

        {values.country === "Brasil" ? (
          <BrazilStateCity
            idPrefix="search"
            state={values.state}
            city={values.city}
            onChange={({ state, city }) => setValues((v) => ({ ...v, state, city }))}
          />
        ) : (
          <>
            <div className="grid gap-1.5">
              <label htmlFor="state" className={labelClass}>
                Estado
              </label>
              <input
                id="state"
                type="text"
                placeholder="Lisboa"
                value={values.state}
                onChange={(e) => setValues((v) => ({ ...v, state: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="city" className={labelClass}>
                Cidade
              </label>
              <input
                id="city"
                type="text"
                required
                placeholder="Porto"
                value={values.city}
                onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))}
                className={inputClass}
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-1 flex w-full items-center justify-center gap-2.5 rounded-[11px] bg-gradient-to-br from-brand-2 via-brand to-[#6d28d9] px-4 py-3 font-display text-[13.5px] font-bold tracking-[0.01em] text-white shadow-[0_0_0_1px_rgba(192,132,252,0.3),0_12px_26px_-12px_rgba(139,92,246,1)] transition-all hover:-translate-y-px hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(192,132,252,0.5),0_18px_34px_-14px_rgba(139,92,246,1)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.2-3.2" />
          </svg>
          Buscar Negócios
        </button>
        <p className="-mt-1.5 text-center text-[11.5px] text-muted">Abre o Google Maps em uma nova aba</p>

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
