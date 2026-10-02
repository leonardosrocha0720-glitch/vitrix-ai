"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PALETTES } from "@/lib/palettes";
import { buildSitePrompt } from "@/lib/buildSitePrompt";
import type { TipoCTA } from "@/types/business";

interface PromptGeneratorProps {
  nome: string;
  nicho: string;
  cidade: string;
  estado?: string;
  telefone: string;
  rating?: number;
  reviewCount?: number;
}

const AI_STUDIO_URL = "https://aistudio.google.com/prompts/new_chat";

const CTA_OPTIONS: { value: TipoCTA; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "ligar", label: "Ligar" },
  { value: "formulario", label: "Formulário" },
];

const labelClass = "font-data text-[9.5px] uppercase tracking-[0.14em] text-muted";
const inputClass =
  "w-full rounded-[10px] border border-line bg-[#0a0a12] px-3 py-2.5 text-[13.5px] text-ink outline-none transition-all placeholder:text-[#565270] focus:border-brand/60 focus:ring-[3px] focus:ring-brand/15";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-brand-2 via-brand to-[#6d28d9] px-5 py-2.5 font-display text-[13.5px] font-bold text-white shadow-[0_12px_26px_-12px_rgba(139,92,246,1)] transition-all hover:-translate-y-px hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:brightness-100";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[10px] border border-line bg-white/[0.035] px-4 py-2.5 text-[13px] font-semibold text-ink-2 transition-all hover:border-brand/50 hover:text-ink";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback para contextos sem Clipboard API (ex.: http em rede local)
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  }
}

export default function PromptGenerator({
  nome,
  nicho,
  cidade,
  estado,
  telefone: initialPhone,
  rating,
  reviewCount,
}: PromptGeneratorProps) {
  const [telefone, setTelefone] = useState(initialPhone);
  const [horario, setHorario] = useState("");
  const [servicos, setServicos] = useState("");
  const [diferencial, setDiferencial] = useState("");
  const [tipoCTA, setTipoCTA] = useState<TipoCTA>("whatsapp");
  const [paletteId, setPaletteId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLElement>(null);

  const palette = PALETTES.find((p) => p.id === paletteId) ?? null;
  const phoneValid = telefone.replace(/\D/g, "").length >= 10;
  const canGenerate = phoneValid && palette !== null;

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canGenerate || !palette) return;
    setPrompt(
      buildSitePrompt({
        nome,
        nicho: nicho || "negócio local",
        cidade,
        estado,
        telefone: telefone.trim(),
        horario: horario.trim(),
        servicos: servicos.trim(),
        diferencial: diferencial.trim(),
        tipoCTA,
        palette,
        rating,
        reviewCount,
      }),
    );
    setCopied(false);
    requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const handleCopy = async () => {
    if (prompt && (await copyToClipboard(prompt))) setCopied(true);
  };

  if (!nome) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-5 text-center">
        <p className="text-[14px] text-ink-2">Nenhum negócio selecionado.</p>
        <Link href="/clientes" className={secondaryButtonClass}>
          Procurar clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4 pl-16 lg:px-6 lg:pl-6">
        <div className="min-w-0">
          <h1 className="font-display text-[21px] font-bold tracking-[-0.02em] text-ink text-balance">
            Criar site
          </h1>
          <p className="mt-0.5 truncate font-data text-[11.5px] uppercase tracking-[0.1em] text-brand-2">
            {nome}
            {nicho && ` · ${nicho}`}
            {cidade && ` · ${cidade}`}
            {estado && `/${estado}`}
          </p>
        </div>
        <Link href="/clientes" className="text-[13px] text-muted transition-colors hover:text-ink">
          Voltar aos resultados
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-4xl gap-[22px] px-5 pb-14 pt-6 lg:px-6">
        <section className="rounded-2xl border border-line bg-surface">
          <div className="flex items-center gap-2.5 border-b border-line-soft px-[18px] pb-3.5 pt-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-brand-2">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
            <h2 className="font-display text-[14px] font-bold text-ink">Dados do negócio</h2>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 px-[18px] pb-[18px] pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="gp-telefone" className={labelClass}>
                  Telefone / WhatsApp <span className="text-brand-2">*</span>
                </label>
                <input
                  id="gp-telefone"
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className={`${inputClass} font-data tabular-nums`}
                />
                {telefone && !phoneValid && (
                  <span className="text-[11.5px] text-red-300">Informe o telefone com DDD.</span>
                )}
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="gp-horario" className={labelClass}>
                  Horário de funcionamento
                </label>
                <input
                  id="gp-horario"
                  type="text"
                  placeholder="Seg-Sex 8h-18h, Sáb 8h-12h"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="gp-servicos" className={labelClass}>
                Principais serviços
              </label>
              <textarea
                id="gp-servicos"
                rows={3}
                placeholder="Corte masculino, barba, progressiva"
                value={servicos}
                onChange={(e) => setServicos(e.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="gp-diferencial" className={labelClass}>
                Diferencial principal
              </label>
              <input
                id="gp-diferencial"
                type="text"
                placeholder="10 anos de experiência, estacionamento grátis"
                value={diferencial}
                onChange={(e) => setDiferencial(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid gap-1.5">
              <span className={labelClass}>Tipo de CTA</span>
              <div className="grid grid-cols-3 gap-2 sm:max-w-md">
                {CTA_OPTIONS.map((opt) => {
                  const isSelected = tipoCTA === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTipoCTA(opt.value)}
                      aria-pressed={isSelected}
                      className={`rounded-[10px] border bg-[#0a0a12] px-2 py-2.5 text-[12.5px] font-semibold transition-all ${
                        isSelected
                          ? "border-brand text-ink shadow-[0_0_0_1px_var(--color-brand),0_0_24px_-8px_var(--color-brand)]"
                          : "border-line text-muted hover:border-brand/50 hover:text-ink"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-1.5">
              <span className={labelClass}>
                Paleta de cores <span className="text-brand-2">*</span>
              </span>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {PALETTES.map((p) => {
                  const isSelected = paletteId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPaletteId(p.id)}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-3 rounded-xl border bg-[#0a0a12] p-3 text-left transition-all ${
                        isSelected
                          ? "border-brand shadow-[0_0_0_1px_var(--color-brand),0_0_24px_-8px_var(--color-brand)]"
                          : "border-line hover:border-brand/50"
                      }`}
                    >
                      <span className="flex shrink-0 -space-x-1.5">
                        {[p.primary, p.secondary, p.bg].map((color) => (
                          <span
                            key={color}
                            className="h-5 w-5 rounded-full border border-white/10"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                      <span className="min-w-0 text-[12.5px] font-semibold text-ink">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end border-t border-line-soft pt-4">
              <button type="submit" disabled={!canGenerate} className={primaryButtonClass}>
                {prompt ? "Atualizar prompt" : "Gerar prompt"}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </form>
        </section>

        {prompt && (
          <section ref={resultRef} className="scroll-mt-6 rounded-2xl border border-line bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-[18px] pb-3.5 pt-4">
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-brand-2">
                  <path d="M12 3l1.9 4.6 4.6 1.9-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                </svg>
                <h2 className="font-display text-[14px] font-bold text-ink">Prompt pronto</h2>
              </div>
              <span className="text-[12px] text-muted">Copie e cole no Google AI Studio</span>
            </div>

            <div className="grid gap-3.5 px-[18px] pb-[18px] pt-4">
              <textarea
                readOnly
                value={prompt}
                rows={18}
                onFocus={(e) => e.currentTarget.select()}
                className={`${inputClass} resize-y font-data text-[12.5px] leading-relaxed`}
              />
              <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-end">
                <a href={AI_STUDIO_URL} target="_blank" rel="noopener noreferrer" className={secondaryButtonClass}>
                  Abrir Google AI Studio
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
                  </svg>
                </a>
                <button type="button" onClick={handleCopy} className={primaryButtonClass}>
                  {copied ? "Copiado!" : "Copiar prompt"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
