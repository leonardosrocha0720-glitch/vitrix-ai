"use client";

import { useEffect, useState } from "react";

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
      if (res.status === 402) {
        throw new Error("Créditos insuficientes. Compre mais créditos na aba Conta.");
      }
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
    await navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-brand/15 bg-panel px-5">
        <div className="flex items-center gap-2">
          <span className="text-lg text-brand">⚡</span>
          <span className="text-sm font-bold text-ink">
            Vitrix<span className="text-brand">AI</span>
          </span>
        </div>

        <div className="hidden flex-col items-center sm:flex">
          <h2 className="text-sm font-bold text-ink">{businessName}</h2>
          {paletteName && <span className="text-xs text-brand">{paletteName}</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePublish}
            disabled={!html || publishing || Boolean(publishedUrl)}
            className="inline-flex items-center gap-2 rounded-lg border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/20 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {publishing ? "Publicando..." : "🌐 Publicar Site"}
          </button>
          <button
            onClick={onDownload}
            disabled={!html}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand to-brand-hover px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
          >
            📥 Baixar HTML
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            ✕ Fechar
          </button>
        </div>
      </div>

      {publishError && (
        <div className="shrink-0 border-b border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-300">
          ⚠ {publishError}
        </div>
      )}

      {publishedUrl && (
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-success/20 bg-success/10 px-5 py-3 text-sm">
          <span className="font-semibold text-success">✓ Site publicado!</span>
          <a
            href={publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-brand underline hover:text-ink"
          >
            {publishedUrl}
          </a>
          <button
            onClick={handleCopyUrl}
            className="rounded-lg border border-white/10 px-3 py-1 text-xs font-medium text-muted transition-colors hover:text-ink"
          >
            {copied ? "Copiado!" : "Copiar link"}
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
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <span className="animate-pulse text-4xl text-brand">⚡</span>
            <p key={messageIndex} className="animate-fade-in-up text-sm font-medium text-muted">
              {LOADING_MESSAGES[messageIndex]}
            </p>
          </div>
        )}
      </div>

      <div className="flex h-10 shrink-0 items-center justify-between border-t border-brand/10 bg-panel px-5 text-xs text-muted">
        <span>{generationSeconds ? `Site gerado em ${generationSeconds}s` : "Gerando..."}</span>
        <span>Powered by Claude AI</span>
      </div>
    </div>
  );
}
