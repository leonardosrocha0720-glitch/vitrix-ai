"use client";

import { useEffect, useState } from "react";
import Radar from "@/components/Radar";

interface SitePreviewModalProps {
  html: string | null;
  businessName: string;
  paletteName: string;
  generationSeconds: number | null;
  onClose: () => void;
  onDownload: () => void;
}

const LOADING_MESSAGES = [
  "Analisando o negócio...",
  "Buscando imagens...",
  "Gerando o site...",
  "Finalizando...",
];

export default function SitePreviewModal({
  html,
  businessName,
  paletteName,
  generationSeconds,
  onClose,
  onDownload,
}: SitePreviewModalProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handlePublish() {
    if (!html) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch("/api/publish-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent: html, businessName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao publicar o site.");
      setPublishedUrl(data.url);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Erro ao publicar o site.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleCopyUrl() {
    if (!publishedUrl) return;
    try {
      await navigator.clipboard.writeText(publishedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setPublishError("Não foi possível copiar. Selecione o link e copie manualmente.");
    }
  }

  useEffect(() => {
    if (html) return;
    const interval = setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1));
    }, 2000);
    return () => clearInterval(interval);
  }, [html]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-2 via-brand to-[#5b2bb8]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M3 11l18-8-8 18-2-8-8-2z" />
            </svg>
          </span>
          <span className="font-display text-[14px] font-extrabold tracking-[-0.015em] text-ink">
            Vitrix{" "}
            <span className="bg-gradient-to-r from-brand-2 to-brand bg-clip-text text-transparent">
              AI
            </span>
          </span>
        </div>

        <div className="hidden min-w-0 flex-col items-center sm:flex">
          <h2 className="truncate font-display text-[14px] font-bold text-ink">{businessName}</h2>
          {paletteName && (
            <span className="font-data text-[10px] uppercase tracking-[0.12em] text-brand-2">
              {paletteName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePublish}
            disabled={!html || publishing || Boolean(publishedUrl)}
            className="inline-flex items-center gap-2 rounded-[10px] border border-signal/30 bg-signal/10 px-3.5 py-2 text-[12.5px] font-semibold text-signal transition-all hover:bg-signal/20 disabled:cursor-not-allowed disabled:border-line-soft disabled:bg-transparent disabled:text-muted/50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a15 15 0 010 18 15 15 0 010-18z" />
            </svg>
            {publishing ? "Publicando..." : publishedUrl ? "Publicado" : "Publicar"}
          </button>
          <button
            onClick={onDownload}
            disabled={!html}
            className="inline-flex items-center gap-2 rounded-[10px] bg-gradient-to-br from-brand-2 via-brand to-[#6d28d9] px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-[0_10px_22px_-12px_rgba(139,92,246,1)] transition-all hover:-translate-y-px hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M12 3v12" />
              <path d="M7 11l5 5 5-5" />
              <path d="M4 21h16" />
            </svg>
            Baixar HTML
          </button>
          <button
            onClick={onClose}
            aria-label="Fechar preview"
            className="grid h-9 w-9 place-items-center rounded-[10px] border border-line text-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>

      {publishError && (
        <div className="flex shrink-0 items-start gap-2.5 border-b border-red-500/20 bg-red-500/10 px-5 py-3 text-[13px] text-red-300">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-px h-4 w-4 shrink-0">
            <path d="M12 8v5M12 16.5v.5" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          {publishError}
        </div>
      )}

      {publishedUrl && (
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-signal/20 bg-signal/10 px-5 py-3 text-[13px]">
          <span className="inline-flex items-center gap-2 font-semibold text-signal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Site publicado
          </span>
          <a
            href={publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate font-data text-[12px] text-brand-2 underline transition-colors hover:text-ink"
          >
            {publishedUrl}
          </a>
          <button
            onClick={handleCopyUrl}
            className="shrink-0 rounded-lg border border-line px-3 py-1 font-data text-[11px] text-muted transition-colors hover:text-ink"
          >
            {copied ? "Copiado" : "Copiar link"}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {html ? (
          <iframe
            srcDoc={html}
            className="h-full w-full border-0 bg-white"
            title={`Preview - ${businessName}`}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-5">
            <Radar />
            <p key={messageIndex} className="animate-fade-in-up font-display text-[14px] font-bold text-ink">
              {LOADING_MESSAGES[messageIndex]}
            </p>
          </div>
        )}
      </div>

      <div className="flex h-10 shrink-0 items-center justify-between border-t border-line bg-surface px-5 font-data text-[10.5px] uppercase tracking-[0.12em] text-muted">
        <span>{generationSeconds ? `Gerado em ${generationSeconds}s` : "Gerando..."}</span>
        <span>Vitrix AI</span>
      </div>
    </div>
  );
}
