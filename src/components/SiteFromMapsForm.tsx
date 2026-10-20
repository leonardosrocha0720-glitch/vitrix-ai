"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import BrazilStateCity from "@/components/BrazilStateCity";
import { stateName } from "@/lib/brazil";
import { NicheSelect, OTHER_NICHE, inputClass, labelClass } from "@/components/SearchForm";

// Ponte entre a busca no Google Maps e /gerar-prompt: o usuário copia os dados da
// empresa que achou no Maps e cai no PromptGenerator com tudo preenchido.

interface SiteFormValues {
  name: string;
  niche: string;
  customNiche: string; // usado só quando o nicho é "Outro"
  city: string;
  state: string;
  phone: string;
}

const DEFAULT_VALUES: SiteFormValues = {
  name: "",
  niche: "",
  customNiche: "",
  city: "",
  state: "",
  phone: "",
};

export default function SiteFromMapsForm() {
  const router = useRouter();
  const [values, setValues] = useState<SiteFormValues>(DEFAULT_VALUES);
  const [showErrors, setShowErrors] = useState(false);

  const isOther = values.niche === OTHER_NICHE;
  const niche = (isOther ? values.customNiche : values.niche).trim();
  const name = values.name.trim();
  const city = values.city.trim();
  const isValid = Boolean(name && niche && city);

  const set = (field: keyof SiteFormValues) => (value: string) =>
    setValues((v) => ({ ...v, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    // Mesmos nomes de parâmetro que a ResultsTable usa.
    const params = new URLSearchParams({
      nome: name,
      nicho: niche.toLowerCase(),
      cidade: city,
      estado: stateName(values.state),
      telefone: values.phone.trim(),
    });
    router.push(`/gerar-prompt?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-line bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_20px_44px_-34px_#000]"
    >
      <div className="border-b border-line-soft px-[18px] pb-3.5 pt-4">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-brand-2">
            <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4L12 3z" />
            <path d="M19 15l.8 1.9 1.9.8-1.9.8L19 20.5l-.8-1.9-1.9-.8 1.9-.8L19 15z" />
          </svg>
          <h2 className="font-display text-[14px] font-bold tracking-[-0.005em] text-ink">
            Achou um negócio? Gere o site
          </h2>
        </div>
        <p className="mt-1 text-[12.5px] text-muted">
          Copie os dados da empresa do Google Maps e siga para o gerador de site.
        </p>
      </div>

      <div className="grid gap-3.5 px-[18px] pb-[18px] pt-4 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <label htmlFor="site-name" className={labelClass}>
            Nome do negócio
          </label>
          <input
            id="site-name"
            type="text"
            placeholder="Ex: Barbearia do Zé"
            value={values.name}
            onChange={(e) => set("name")(e.target.value)}
            aria-invalid={showErrors && !name}
            className={inputClass}
          />
          {showErrors && !name && (
            <span role="alert" className="text-[11.5px] text-red-300">
              Informe o nome do negócio.
            </span>
          )}
        </div>

        <NicheSelect
          id="site-niche"
          niche={values.niche}
          customNiche={values.customNiche}
          onNicheChange={set("niche")}
          onCustomNicheChange={set("customNiche")}
          error={
            showErrors && !niche
              ? isOther
                ? "Digite o nicho do negócio."
                : "Selecione o nicho do negócio."
              : ""
          }
        />

        <div className="grid gap-1.5">
          <label htmlFor="site-phone" className={labelClass}>
            Telefone <span className="normal-case tracking-normal text-[#565270]">(opcional)</span>
          </label>
          <input
            id="site-phone"
            type="tel"
            placeholder="(42) 99999-9999"
            value={values.phone}
            onChange={(e) => set("phone")(e.target.value)}
            className={inputClass}
          />
        </div>

        <BrazilStateCity
          idPrefix="site"
          state={values.state}
          city={values.city}
          onChange={({ state, city }) => setValues((v) => ({ ...v, state, city }))}
          stateOptional
          cityError={showErrors && !city ? "Informe a cidade." : ""}
        />

        <button
          type="submit"
          className="mt-1 flex w-full items-center justify-center gap-2.5 rounded-[11px] bg-gradient-to-br from-brand-2 via-brand to-[#6d28d9] px-4 py-3 font-display text-[13.5px] font-bold tracking-[0.01em] text-white shadow-[0_0_0_1px_rgba(192,132,252,0.3),0_12px_26px_-12px_rgba(139,92,246,1)] transition-all hover:-translate-y-px hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(192,132,252,0.5),0_18px_34px_-14px_rgba(139,92,246,1)] active:translate-y-0 sm:col-span-2"
        >
          Gerar Site
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </form>
  );
}
