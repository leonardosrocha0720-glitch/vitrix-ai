"use client";

interface LoadingProgressProps {
  messages: string[];
  percent: number;
}

export default function LoadingProgress({ messages, percent }: LoadingProgressProps) {
  const latest = messages[messages.length - 1] ?? "Iniciando busca...";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-brand/15 bg-panel p-6">
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-sm font-medium text-ink">{latest}</p>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-brand-hover transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className="animate-fade-in-up rounded-lg border border-brand/10 bg-panel-2/50 px-3 py-2 text-xs text-muted"
            style={{ animationDelay: `${Math.min(i, 15) * 60}ms` }}
          >
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}
