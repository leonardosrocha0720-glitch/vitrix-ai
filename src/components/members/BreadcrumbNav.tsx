import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  /** Sem href, o item é a página atual. */
  href?: string;
}

export default function BreadcrumbNav({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Navegação estrutural" className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-2">
            {i > 0 && (
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)]/60" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 6l6 6-6 6" />
              </svg>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="truncate text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-bright)]"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate font-medium text-[var(--text-primary)]">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
