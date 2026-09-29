"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type IconProps = { className?: string };

function IconChart({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-5 3 3 5-7" />
    </svg>
  );
}

function IconSearch({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.2-3.2" />
    </svg>
  );
}

function IconUser({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0115 0" />
    </svg>
  );
}

function IconLogout({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 17l5-5-5-5" />
      <path d="M20 12H9" />
      <path d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h5" />
    </svg>
  );
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", Icon: IconChart },
  { href: "/clientes", label: "Procurar Clientes", Icon: IconSearch },
  { href: "/conta", label: "Conta", Icon: IconUser },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    let active = true;
    async function loadCredits() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
      if (active && data) setCredits(data.credits);
    }
    loadCredits();
    return () => {
      active = false;
    };
  }, [supabase, pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Sem total armazenado no banco, o estado vem do próprio saldo.
  const low = credits !== null && credits < 10;
  const empty = credits === 0;

  return (
    <>
      {!mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="fixed left-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-[10px] border border-line bg-surface text-ink lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-[17px] w-[17px]">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      )}

      {mobileOpen && (
        <div
          aria-hidden
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-line bg-gradient-to-b from-[#14121f]/95 to-[#09090f]/95 backdrop-blur-md transition-transform duration-200 lg:static lg:min-h-screen lg:w-[248px] lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between border-b border-line-soft px-5 py-[22px]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-gradient-to-br from-brand-2 via-brand to-[#5b2bb8] shadow-[0_0_0_1px_rgba(192,132,252,0.35),0_6px_18px_-6px_rgba(139,92,246,0.9)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M3 11l18-8-8 18-2-8-8-2z" />
                </svg>
              </span>
              <h1 className="font-display text-[17px] font-extrabold leading-none tracking-[-0.015em] text-ink">
                Vitrix{" "}
                <span className="bg-gradient-to-r from-brand-2 to-brand bg-clip-text text-transparent">
                  AI
                </span>
              </h1>
            </div>
            <p className="mt-2.5 font-data text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted">
              Prospecção inteligente
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
            className="rounded-lg p-1.5 text-muted hover:text-ink lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-[3px] p-3">
          <p className="px-2.5 pb-1.5 pt-2 font-data text-[9.5px] uppercase tracking-[0.16em] text-[#5d5977]">
            Operação
          </p>
          {navItems.map(({ href, label, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center gap-[11px] rounded-[10px] border px-3 py-2.5 text-[13.5px] font-medium transition-all ${
                  isActive
                    ? "border-brand/30 bg-gradient-to-r from-brand/20 to-brand/5 text-ink"
                    : "border-transparent text-muted hover:bg-white/[0.04] hover:text-ink"
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-[3px] bg-brand-2 shadow-[0_0_12px_var(--color-brand)]"
                  />
                )}
                <Icon className={`h-[17px] w-[17px] shrink-0 ${isActive ? "text-brand-2" : "opacity-75"}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line-soft p-3">
          <Link
            href="/conta"
            onClick={() => setMobileOpen(false)}
            className="block rounded-xl border border-line bg-surface px-[13px] py-3 transition-colors hover:border-brand/30"
          >
            <p className="mb-1.5 font-data text-[9.5px] uppercase tracking-[0.14em] text-muted">
              Créditos
            </p>
            <div className="flex items-baseline justify-between gap-2">
              <span
                className={`font-data text-[19px] font-bold tabular-nums leading-none tracking-[-0.02em] ${
                  empty ? "text-warn" : low ? "text-warn" : "text-ink"
                }`}
              >
                {credits === null ? "—" : credits}
              </span>
              <span className="font-data text-[10px] text-muted">
                {empty ? "esgotado" : low ? "acabando" : "disponíveis"}
              </span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-[11px] rounded-[10px] px-3 py-2.5 text-left text-[13.5px] text-muted transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <IconLogout className="h-[17px] w-[17px] shrink-0 opacity-75" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
