"use client";

export default function MembersHero({
  query,
  onQueryChange,
  watchedCount,
  totalCount,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  watchedCount: number;
  totalCount: number;
}) {
  const percent = totalCount === 0 ? 0 : Math.round((watchedCount / totalCount) * 100);

  return (
    <section className="relative overflow-hidden border-b border-[var(--border)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(124,58,237,0.28),transparent_70%),radial-gradient(ellipse_40%_40%_at_85%_30%,rgba(168,85,247,0.12),transparent_70%)]"
      />

      <div className="members-fade-in relative mx-auto max-w-3xl px-4 pb-12 pt-14 text-center sm:px-6 sm:pt-20">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-bright)]">
          Aulas exclusivas
        </p>
        <h1 className="members-title text-3xl font-extrabold leading-tight text-[var(--text-primary)] sm:text-5xl">
          Área de Membros Vitrix <span className="members-gradient-text">AI</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-[var(--text-secondary)] sm:text-lg">
          Aprenda a encontrar clientes, gerar sites com IA e fechar vendas — no seu ritmo.
        </p>

        <label className="relative mx-auto mt-8 block max-w-xl">
          <span className="sr-only">Buscar aulas</span>
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-secondary)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar aulas por título ou assunto..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]/90 py-3.5 pl-12 pr-4 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 outline-none transition-[border-color,box-shadow] focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--accent-glow)]"
          />
        </label>

        <div className="mx-auto mt-8 max-w-xl text-left">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">
              <strong className="font-semibold text-[var(--text-primary)]">{watchedCount}</strong> de{" "}
              {totalCount} aulas concluídas
            </span>
            <span className="tabular-nums text-[var(--accent-bright)]">{percent}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-[var(--bg-hover)]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={totalCount}
            aria-valuenow={watchedCount}
            aria-label="Progresso geral"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-bright)] shadow-[0_0_12px_var(--accent-glow)] transition-[width] duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
