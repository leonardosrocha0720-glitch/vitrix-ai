import type { Metadata } from "next";
import Link from "next/link";
import { Sora } from "next/font/google";
import "./members.css";

// Inter já vem do layout raiz (--font-inter); aqui só entra a Sora dos títulos.
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Área de Membros · Vitrix AI",
    template: "%s · Vitrix AI",
  },
  description: "Aulas para dominar a Vitrix AI: buscar negócios locais e gerar sites com IA.",
};

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`members-root ${sora.variable}`}>
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[#0A0A0F]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/members" className="members-title text-xl font-bold text-[var(--text-primary)]">
            Vitrix <span className="members-gradient-text">AI</span>
          </Link>
          <Link
            href="/clientes"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
          >
            Voltar ao app
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
