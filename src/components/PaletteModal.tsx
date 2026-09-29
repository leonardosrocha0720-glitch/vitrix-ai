"use client";

import { useState } from "react";
import { PALETTES, type ColorPalette } from "@/lib/palettes";

interface PaletteModalProps {
  businessName: string;
  onSelect: (palette: ColorPalette) => void;
  onCancel: () => void;
}

export default function PaletteModal({ businessName, onSelect, onCancel }: PaletteModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = PALETTES.find((p) => p.id === selectedId) ?? null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4 border-b border-line-soft px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-ink">
              Escolha o estilo visual
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

        <div className="grid grid-cols-2 gap-3.5 p-6 sm:grid-cols-3">
          {PALETTES.map((palette) => {
            const isSelected = selectedId === palette.id;
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => setSelectedId(palette.id)}
                className={`relative flex flex-col gap-3 rounded-xl border bg-[#0a0a12] p-4 text-left transition-all ${
                  isSelected
                    ? "border-brand shadow-[0_0_0_1px_var(--color-brand),0_0_24px_-8px_var(--color-brand)]"
                    : "border-line hover:-translate-y-px hover:border-brand/50"
                }`}
              >
                {isSelected && (
                  <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-brand text-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span
                    className="h-6 w-6 rounded-full border border-white/10"
                    style={{ backgroundColor: palette.primary }}
                  />
                  <span
                    className="h-6 w-6 rounded-full border border-white/10"
                    style={{ backgroundColor: palette.secondary }}
                  />
                  <span
                    className="h-6 w-6 rounded-full border border-white/10"
                    style={{ backgroundColor: palette.bg }}
                  />
                </div>
                <span className="text-[13px] font-semibold text-ink">{palette.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end border-t border-line-soft px-6 py-4">
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && onSelect(selected)}
            className="inline-flex items-center gap-2 rounded-[10px] bg-gradient-to-br from-brand-2 via-brand to-[#6d28d9] px-5 py-2.5 font-display text-[13.5px] font-bold text-white shadow-[0_12px_26px_-12px_rgba(139,92,246,1)] transition-all hover:-translate-y-px hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:brightness-100"
          >
            Gerar com este estilo
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
