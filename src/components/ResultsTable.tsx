"use client";

import { useMemo, useState } from "react";
import { exportBusinessesToExcel } from "@/lib/exportExcel";
import type { Business } from "@/types/business";
import type { ColorPalette } from "@/lib/palettes";
import SitePreviewModal from "@/components/SitePreviewModal";
import PaletteModal from "@/components/PaletteModal";

interface ResultsTableProps {
  results: Business[];
  searchNiche?: string;
  searchCity?: string;
}

type SortKey = "name" | "address" | "rating" | "website";
type SortDirection = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Negócio" },
  { key: "address", label: "Endereço" },
  { key: "rating", label: "Avaliação" },
  { key: "website", label: "Status" },
];

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-muted">—</span>;
  const filled = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="tracking-tight text-amber-400">
        {"★".repeat(filled)}
        <span className="text-white/10">{"★".repeat(5 - filled)}</span>
      </span>
      <span className="text-xs font-medium tabular-nums text-muted">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function ResultsTable({
  results,
  searchNiche = "",
  searchCity = "",
}: ResultsTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Site generation state
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewBusiness, setPreviewBusiness] = useState<Business | null>(null);
  const [previewPalette, setPreviewPalette] = useState<ColorPalette | null>(null);
  const [genSeconds, setGenSeconds] = useState<number | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [pendingBusiness, setPendingBusiness] = useState<Business | null>(null);
  const [showPaletteModal, setShowPaletteModal] = useState(false);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? results.filter(
          (b) => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q),
        )
      : results;

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "address": cmp = a.address.localeCompare(b.address); break;
        case "rating": cmp = (a.rating ?? 0) - (b.rating ?? 0); break;
        case "website": cmp = Number(Boolean(a.website)) - Number(Boolean(b.website)); break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [results, query, sortKey, sortDirection]);

  const sortIndicator = (key: SortKey) => {
    if (key !== sortKey) return null;
    return <span className="ml-1 text-brand">{sortDirection === "asc" ? "▲" : "▼"}</span>;
  };

  const handleGenerateSite = async (business: Business, palette: ColorPalette) => {
    setGeneratingId(business.id);
    setGenError(null);
    setPreviewBusiness(business);
    setPreviewPalette(palette);
    setPreviewHtml(null);
    setGenSeconds(null);
    const startedAt = Date.now();
    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: business.name,
          address: business.address,
          phone: business.phone,
          rating: business.rating,
          reviewCount: business.reviewCount,
          niche: searchNiche || "negócio local",
          city: searchCity || null,
          palette,
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        throw new Error("Créditos insuficientes. Compre mais créditos na aba Conta.");
      }
      if (data.error) throw new Error(data.error);
      setPreviewHtml(data.html);
      setGenSeconds(Math.max(1, Math.round((Date.now() - startedAt) / 1000)));
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Erro ao gerar site.");
      setPreviewBusiness(null);
      setPreviewPalette(null);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleOpenPaletteModal = (business: Business) => {
    setPendingBusiness(business);
    setShowPaletteModal(true);
  };

  const handleSelectPalette = (palette: ColorPalette) => {
    const business = pendingBusiness;
    setShowPaletteModal(false);
    setPendingBusiness(null);
    if (business) handleGenerateSite(business, palette);
  };

  const handleCancelPaletteModal = () => {
    setShowPaletteModal(false);
    setPendingBusiness(null);
  };

  const handleClosePreview = () => {
    setPreviewHtml(null);
    setPreviewBusiness(null);
    setPreviewPalette(null);
    setGenSeconds(null);
  };

  const handleDownload = () => {
    if (!previewHtml || !previewBusiness) return;
    const blob = new Blob([previewHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${previewBusiness.name.toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {previewBusiness && (
        <SitePreviewModal
          html={previewHtml}
          businessName={previewBusiness.name}
          paletteName={previewPalette?.name ?? ""}
          generationSeconds={genSeconds}
          onClose={handleClosePreview}
          onDownload={handleDownload}
        />
      )}

      {showPaletteModal && pendingBusiness && (
        <PaletteModal
          businessName={pendingBusiness.name}
          onSelect={handleSelectPalette}
          onCancel={handleCancelPaletteModal}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-brand/15 bg-panel shadow-lg shadow-black/20">
        <div className="flex flex-col gap-3 border-b border-brand/10 bg-panel-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Buscar por nome ou endereço..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-brand/15 bg-panel px-3 py-2 text-sm text-ink placeholder:text-muted/50 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="button"
            onClick={() => exportBusinessesToExcel(filteredAndSorted)}
            disabled={filteredAndSorted.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Exportar Excel
          </button>
        </div>

        {genError && (
          <div className="border-b border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            ⚠ {genError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-brand/10 bg-panel-2 text-xs uppercase tracking-wide text-muted">
                <th className="w-12 px-4 py-3">#</th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="cursor-pointer select-none px-4 py-3 hover:text-ink"
                  >
                    {col.label}
                    {sortIndicator(col.key)}
                  </th>
                ))}
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((b, index) => {
                const isGeneratingThis = generatingId === b.id;
                const isDimmed = generatingId !== null && !isGeneratingThis;
                return (
                  <tr
                    key={b.id}
                    className={`animate-fade-in-up border-b border-brand/5 transition-colors last:border-0 ${
                      index % 2 === 0 ? "bg-panel" : "bg-panel-3"
                    } ${
                      isGeneratingThis
                        ? "shimmer-row"
                        : "hover:border-l-2 hover:border-l-brand hover:bg-brand/5"
                    } ${isDimmed ? "pointer-events-none opacity-40" : ""}`}
                    style={{ animationDelay: `${Math.min(index, 20) * 40}ms` }}
                  >
                    <td className="px-4 py-3 tabular-nums text-muted">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-ink">
                      <a
                        href={b.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver no Google Maps"
                        className="hover:text-brand hover:underline"
                      >
                        {b.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted">{b.address}</td>
                    <td className="px-4 py-3">
                      <StarRating rating={b.rating} />
                    </td>
                    <td className="px-4 py-3">
                      {b.website ? (
                        <a
                          href={b.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:text-ink"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                          Tem site
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          Sem site
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {b.phone ? (
                        <a href={`tel:${b.phone}`} className="text-muted hover:text-ink hover:underline">
                          {b.phone}
                        </a>
                      ) : (
                        <span className="text-muted/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleOpenPaletteModal(b)}
                        disabled={generatingId !== null}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand to-brand-hover px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {isGeneratingThis ? (
                          <>
                            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Gerando...
                          </>
                        ) : (
                          <>✨ Gerar Site</>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredAndSorted.length === 0 && (
            <p className="p-8 text-center text-sm text-muted">
              Nenhum resultado encontrado para os filtros atuais.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
