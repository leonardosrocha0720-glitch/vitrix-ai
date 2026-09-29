"use client";

import Radar from "@/components/Radar";

interface LoadingProgressProps {
  messages: string[];
  percent: number;
}

export default function LoadingProgress({ messages, percent }: LoadingProgressProps) {
  const latest = messages[messages.length - 1] ?? "Iniciando varredura...";

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-center gap-4">
        <Radar size="md" />
        <div className="min-w-0">
          <p className="font-display text-[14px] font-bold text-ink">{latest}</p>
          <p className="mt-0.5 font-data text-[10px] uppercase tracking-[0.14em] text-muted">
            Varredura em andamento
          </p>
        </div>
        <span className="ml-auto shrink-0 font-data text-[19px] font-bold tabular-nums tracking-[-0.02em] text-brand-2">
          {percent}%
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2 shadow-[0_0_12px_-2px_var(--color-brand)] transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className="animate-fade-in-up flex items-start gap-2.5 rounded-[10px] border border-line-soft bg-[#0a0a12] px-3 py-2 font-data text-[11.5px] text-muted"
            style={{ animationDelay: `${Math.min(i, 15) * 60}ms` }}
          >
            <span
              aria-hidden
              className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-brand/70"
            />
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}
