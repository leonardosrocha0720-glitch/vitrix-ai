"use client";

import { useEffect, useState } from "react";
import { BR_STATES, fetchCities } from "@/lib/brazil";
import { SelectChevron, inputClass, labelClass, selectClass } from "@/components/SearchForm";

type CitiesState = { uf: string; status: "loading" | "error" | "ready"; cities: string[] };

/**
 * Selects encadeados de Estado (sigla) e Cidade (nome) para o Brasil. Renderiza
 * dois blocos irmãos, para o formulário que o usa decidir o layout.
 * `state` guarda a sigla; trocar o estado limpa a cidade.
 */
export default function BrazilStateCity({
  idPrefix,
  state,
  city,
  onChange,
  stateOptional = false,
  cityError,
}: {
  idPrefix: string;
  state: string;
  city: string;
  onChange: (next: { state: string; city: string }) => void;
  stateOptional?: boolean;
  cityError?: string;
}) {
  const [loaded, setLoaded] = useState<CitiesState>({ uf: "", status: "ready", cities: [] });

  useEffect(() => {
    if (!state) return;
    const ctrl = new AbortController();
    fetchCities(state, ctrl.signal)
      .then((cities) => setLoaded({ uf: state, status: "ready", cities }))
      .catch(() => {
        if (!ctrl.signal.aborted) setLoaded({ uf: state, status: "error", cities: [] });
      });
    return () => ctrl.abort();
  }, [state]);

  // Resultado de outro estado (troca em andamento) conta como "carregando".
  const status = !state ? "ready" : loaded.uf === state ? loaded.status : "loading";
  const cities = loaded.uf === state ? loaded.cities : [];

  return (
    <>
      <div className="grid gap-1.5">
        <label htmlFor={`${idPrefix}-state`} className={labelClass}>
          Estado{" "}
          {stateOptional && <span className="normal-case tracking-normal text-[#565270]">(opcional)</span>}
        </label>
        <div className="relative">
          <select
            id={`${idPrefix}-state`}
            value={state}
            onChange={(e) => onChange({ state: e.target.value, city: "" })}
            className={`${selectClass} ${state ? "" : "text-[#565270]"}`}
          >
            <option value="">Selecione um estado</option>
            {BR_STATES.map((s) => (
              <option key={s.uf} value={s.uf} className="bg-surface-2 text-ink">
                {s.uf} — {s.name}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor={`${idPrefix}-city`} className={labelClass}>
          Cidade
        </label>
        {status === "error" ? (
          // IBGE fora do ar: não trava a busca, cai para digitação livre.
          <input
            id={`${idPrefix}-city`}
            type="text"
            placeholder="Digite a cidade"
            value={city}
            onChange={(e) => onChange({ state, city: e.target.value })}
            aria-invalid={Boolean(cityError)}
            className={inputClass}
          />
        ) : (
          <div className="relative">
            <select
              id={`${idPrefix}-city`}
              value={city}
              disabled={!state || status === "loading"}
              onChange={(e) => onChange({ state, city: e.target.value })}
              aria-invalid={Boolean(cityError)}
              className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-60 ${city ? "" : "text-[#565270]"}`}
            >
              <option value="">
                {!state ? "Selecione um estado primeiro" : status === "loading" ? "Carregando cidades..." : "Selecione uma cidade"}
              </option>
              {cities.map((c) => (
                <option key={c} value={c} className="bg-surface-2 text-ink">
                  {c}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
        )}
        {status === "error" && (
          <span className="text-[11.5px] text-muted">Não foi possível carregar a lista de cidades.</span>
        )}
        {cityError && (
          <span role="alert" className="text-[11.5px] text-red-300">
            {cityError}
          </span>
        )}
      </div>
    </>
  );
}
