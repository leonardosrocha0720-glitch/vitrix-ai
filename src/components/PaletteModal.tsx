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
      <div className="w-full max-w-2xl rounded-2xl border border-brand/20 bg-panel shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between border-b border-brand/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Escolha o estilo visual</h2>
            <p className="text-sm font-medium text-brand">{businessName}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3">
          {PALETTES.map((palette) => {
            const isSelected = selectedId === palette.id;
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => setSelectedId(palette.id)}
                className={`relative flex flex-col gap-3 rounded-xl border-2 bg-panel-2 p-4 text-left transition-all ${
                  isSelected
                    ? "border-brand"
                    : "border-white/5 hover:scale-[1.03] hover:border-brand/50"
                }`}
              >
                {isSelected && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] text-white">
                    ✓
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
                <span className="text-sm font-semibold text-ink">{palette.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end border-t border-brand/10 px-6 py-4">
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && onSelect(selected)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand to-brand-hover px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
          >
            Gerar com este estilo →
          </button>
        </div>
      </div>
    </div>
  );
}
