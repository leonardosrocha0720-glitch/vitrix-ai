"use client";

import { useMemo, useState } from "react";
import { exportBusinessesToExcel } from "@/lib/exportExcel";
import type { Business, BusinessExtraData } from "@/types/business";
import type { ColorPalette } from "@/lib/palettes";
import SitePreviewModal from "@/components/SitePreviewModal";
import PaletteModal from "@/components/PaletteModal";
import BusinessDataModal from "@/components/BusinessDataModal";

interface ResultsTableProps {
  results: Business[];
  searchNiche?: string;
  searchCity?: string;
}

type SortKey = "name" | "rating" | "website";
type SortDirection = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Negócio" },
  { key: "rating", label: "Avaliação" },
];

function StarRating({ rating, reviews }: { rating: number | null; reviews: number | null }) {
  if (rating === null) return <span className="text-muted">—</span>;
  return (
    <>
      <span className="flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-warn">
          <path d="M12 2l3 6.5 7 .9-5 4.8 1.2 7L12 17.8 5.8 21.2 7 14.2 2 9.4l7-.9z" />
        </svg>
        <span className="font-data text-[12.5px] tabular-nums text-ink">
          {rating.toFixed(1).replace(".", ",")}
        </span>
      </span>
      {reviews !== null && reviews > 0 && (
        <span className="mt-0.5 block font-data text-[11px] tabular-nums text-muted">
          {reviews} avaliações
        </span>
      )}
    </>
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
  const [pendingExtra, setPendingExtra] = useState<BusinessExtraData | null>(null);
  const [showDataModal, setShowDataModal] = useState(false);
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
        case "rating": cmp = (a.rating ?? 0) - (b.rating ?? 0); break;
        case "website": cmp = Number(Boolean(a.website)) - Number(Boolean(b.website)); break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [results, query, sortKey, sortDirection]);

  const noSiteCount = useMemo(
    () => filteredAndSorted.filter((b) => !b.website).length,
    [filteredAndSorted],
  );

  const sortIndicator = (key: SortKey) => {
    if (key !== sortKey) return null;
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`ml-1 inline-block h-3 w-3 text-brand-2 ${sortDirection === "asc" ? "rotate-180" : ""}`}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    );
  };

  const handleGenerateSite = async (
    business: Business,
    palette: ColorPalette,
    extra: BusinessExtraData,
  ) => {
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
          ...extra,
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        throw new Error("Créditos insuficientes. Veja seu saldo na aba Conta.");
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

  // Fluxo: Gerar site -> BusinessDataModal -> PaletteModal -> /api/generate-site
  const handleOpenDataModal = (business: Business) => {
    setPendingBusiness(business);
    setPendingExtra(null);
    setShowDataModal(true);
  };

  const handleConfirmData = (extra: BusinessExtraData) => {
    setPendingExtra(extra);
    setShowDataModal(false);
    setShowPaletteModal(true);
  };

  const handleSelectPalette = (palette: ColorPalette) => {
    const business = pendingBusiness;
    const extra = pendingExtra;
    setShowPaletteModal(false);
    setPendingBusiness(null);
    setPendingExtra(null);
    if (business && extra) handleGenerateSite(business, palette, extra);
  };

  const handleCancelModals = () => {
    setShowDataModal(false);
    setShowPaletteModal(false);
    setPendingBusiness(null);
    setPendingExtra(null);
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

  const thClass =
    "select-none whitespace-nowrap border-b border-line-soft px-4 py-2.5 text-left font-data text-[9.5px] font-medium uppercase tracking-[0.14em] text-muted";

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

      {showDataModal && pendingBusiness && (
        <BusinessDataModal
          businessName={pendingBusiness.name}
          initialPhone={pendingBusiness.phone}
          onConfirm={handleConfirmData}
          onCancel={handleCancelModals}
        />
      )}

      {showPaletteModal && pendingBusiness && (
        <PaletteModal
          businessName={pendingBusiness.name}
          onSelect={handleSelectPalette}
          onCancel={handleCancelModals}
        />
      )}

      <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-line-soft px-[18px] py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="font-display text-[14px] font-bold text-ink">Resultados</h3>
            <span className="font-data text-[11.5px] text-muted">
              {filteredAndSorted.length} encontrados ·{" "}
              <b className="font-bold text-signal">{noSiteCount} sem site</b>
            </span>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <input
              type="text"
              placeholder="Filtrar por nome ou endereço..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-[10px] border border-line bg-[#0a0a12] px-3 py-2 text-[13px] text-ink outline-none transition-all placeholder:text-[#565270] focus:border-brand/60 focus:ring-[3px] focus:ring-brand/15 sm:w-56"
            />
            <button
              type="button"
              onClick={() => exportBusinessesToExcel(filteredAndSorted)}
              disabled={filteredAndSorted.length === 0}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-signal/30 bg-signal/10 px-3.5 py-2 text-[12.5px] font-semibold text-signal transition-all hover:bg-signal/20 disabled:cursor-not-allowed disabled:border-line-soft disabled:bg-transparent disabled:text-muted/50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="M12 3v12" />
                <path d="M7 11l5 5 5-5" />
                <path d="M4 21h16" />
              </svg>
              Exportar
            </button>
          </div>
        </div>

        {genError && (
          <div className="flex items-start gap-2.5 border-b border-red-500/20 bg-red-500/5 px-[18px] py-3 text-[13px] text-red-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-px h-4 w-4 shrink-0">
              <path d="M12 8v5M12 16.5v.5" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            {genError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr>
                <th className={`${thClass} w-10`}>#</th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`${thClass} cursor-pointer transition-colors hover:text-ink`}
                  >
                    {col.label}
                    {sortIndicator(col.key)}
                  </th>
                ))}
                <th className={thClass}>Contato</th>
                <th
                  onClick={() => handleSort("website")}
                  className={`${thClass} cursor-pointer transition-colors hover:text-ink`}
                >
                  Site
                  {sortIndicator("website")}
                </th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((b, index) => {
                const isGeneratingThis = generatingId === b.id;
                const isDimmed = generatingId !== null && !isGeneratingThis;
                return (
                  <tr
                    key={b.id}
                    className={`animate-fade-in-up border-b border-line-soft transition-colors last:border-0 ${
                      isGeneratingThis ? "shimmer-row" : "hover:bg-brand/[0.05]"
                    } ${isDimmed ? "pointer-events-none opacity-40" : ""}`}
                    style={{ animationDelay: `${Math.min(index, 20) * 40}ms` }}
                  >
                    <td className="px-4 py-3.5 font-data text-[11px] tabular-nums text-muted">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3.5">
                      <a
                        href={b.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver no Google Maps"
                        className="text-[13.5px] font-semibold tracking-[-0.005em] text-ink transition-colors hover:text-brand-2"
                      >
                        {b.name}
                      </a>
                      <div className="mt-0.5 text-[11.5px] text-muted">{b.address}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <StarRating rating={b.rating} reviews={b.reviewCount ?? null} />
                    </td>

                    <td className="px-4 py-3.5">
                      {b.phone ? (
                        <a
                          href={`tel:${b.phone}`}
                          className="font-data text-[12.5px] tabular-nums text-ink-2 transition-colors hover:text-ink"
                        >
                          {b.phone}
                        </a>
                      ) : (
                        <span className="font-data text-[12.5px] text-muted/50">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {b.website ? (
                        <a
                          href={b.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-white/[0.035] px-2.5 py-1 font-data text-[9.5px] uppercase tracking-[0.1em] text-muted transition-colors hover:text-ink"
                        >
                          <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#4d4a63]" />
                          Tem site
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-signal/25 bg-signal/[0.09] px-2.5 py-1 font-data text-[9.5px] uppercase tracking-[0.1em] text-signal">
                          <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-signal shadow-[0_0_7px_var(--color-signal)]" />
                          Sem site
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleOpenDataModal(b)}
                        disabled={generatingId !== null}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[9px] border border-brand/[0.34] bg-brand/[0.12] px-3.5 py-[7px] text-xs font-semibold text-brand-2 transition-all hover:bg-brand/[0.26] hover:text-white hover:shadow-[0_0_18px_-5px_rgba(139,92,246,0.9)] disabled:cursor-not-allowed disabled:border-line-soft disabled:bg-transparent disabled:text-muted/50 disabled:shadow-none"
                      >
                        {isGeneratingThis ? (
                          <>
                            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Gerando
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                              <path d="M12 3l1.9 4.6 4.6 1.9-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                              <path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
                            </svg>
                            Gerar site
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredAndSorted.length === 0 && (
            <p className="px-6 py-10 text-center text-[13px] text-muted">
              Nenhum resultado para os filtros atuais.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
