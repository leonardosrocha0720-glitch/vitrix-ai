"use client";

import { useState } from "react";
import type { BusinessExtraData, TipoCTA } from "@/types/business";

interface BusinessDataModalProps {
  businessName: string;
  initialPhone: string | null;
  onConfirm: (data: BusinessExtraData) => void;
  onCancel: () => void;
}

const CTA_OPTIONS: { value: TipoCTA; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "ligar", label: "Ligar" },
  { value: "formulario", label: "Formulário de contato" },
];

const labelClass = "font-data text-[9.5px] uppercase tracking-[0.14em] text-muted";

const inputClass =
  "w-full rounded-[10px] border border-line bg-[#0a0a12] px-3 py-2.5 text-[13.5px] text-ink outline-none transition-all placeholder:text-[#565270] focus:border-brand/60 focus:ring-[3px] focus:ring-brand/15";

export default function BusinessDataModal({
  businessName,
  initialPhone,
  onConfirm,
  onCancel,
}: BusinessDataModalProps) {
  const [telefone, setTelefone] = useState(initialPhone ?? "");
  const [horario, setHorario] = useState("");
  const [diferencial, setDiferencial] = useState("");
  const [servicos, setServicos] = useState("");
  const [tipoCTA, setTipoCTA] = useState<TipoCTA>("whatsapp");

  const phoneDigits = telefone.replace(/\D/g, "");
  const isValid = phoneDigits.length >= 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onConfirm({
      telefone: telefone.trim(),
      horario: horario.trim() || undefined,
      diferencial: diferencial.trim() || undefined,
      servicos: servicos.trim() || undefined,
      tipoCTA,
    });
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/50"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-soft px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-ink">
              Dados do negócio
            </h2>
            <p className="mt-0.5 truncate font-data text-[11.5px] uppercase tracking-[0.1em] text-brand-2">
              {businessName}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="grid gap-4 overflow-y-auto p-6">
          <div className="grid gap-1.5">
            <label htmlFor="bd-telefone" className={labelClass}>
              Telefone / WhatsApp <span className="text-brand-2">*</span>
            </label>
            <input
              id="bd-telefone"
              type="tel"
              required
              autoFocus
              placeholder="(11) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className={inputClass}
            />
            {telefone && !isValid && (
              <span className="text-[11.5px] text-red-300">Informe o telefone com DDD.</span>
            )}
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="bd-horario" className={labelClass}>
              Horário de funcionamento
            </label>
            <input
              id="bd-horario"
              type="text"
              placeholder="Seg-Sex 8h-18h, Sáb 8h-12h"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="bd-diferencial" className={labelClass}>
              Diferencial principal
            </label>
            <input
              id="bd-diferencial"
              type="text"
              placeholder="10 anos de experiência, atendimento em domicílio"
              value={diferencial}
              onChange={(e) => setDiferencial(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid gap-1.5">
            <span className={labelClass}>Botão principal (CTA)</span>
            <div className="grid grid-cols-3 gap-2">
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
            <label htmlFor="bd-servicos" className={labelClass}>
              Serviços oferecidos <span className="normal-case tracking-normal">(opcional)</span>
            </label>
            <textarea
              id="bd-servicos"
              rows={3}
              placeholder="Corte, coloração, escova progressiva"
              value={servicos}
              onChange={(e) => setServicos(e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-line-soft px-6 py-4">
          <button
            type="submit"
            disabled={!isValid}
            className="inline-flex items-center gap-2 rounded-[10px] bg-gradient-to-br from-brand-2 via-brand to-[#6d28d9] px-5 py-2.5 font-display text-[13.5px] font-bold text-white shadow-[0_12px_26px_-12px_rgba(139,92,246,1)] transition-all hover:-translate-y-px hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:brightness-100"
          >
            Continuar
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
