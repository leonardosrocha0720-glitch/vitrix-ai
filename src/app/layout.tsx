import type { Metadata } from "next";
import { Inter, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Grotesca industrial: títulos e ações. Apertada, com peso.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

// Mono: números, rótulos técnicos e qualquer coluna que precise alinhar.
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Vitrix AI",
  description:
    "Vitrix AI — prospecção de negócios locais via Google Places API, com destaque para quem ainda não tem site e geração de sites por IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${archivo.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-base text-ink">
        <div aria-hidden className="ambient-grid pointer-events-none fixed inset-0 -z-10" />
        <div
          aria-hidden
          className="ambient-glow pointer-events-none fixed -left-40 -top-56 -z-10 h-[620px] w-[760px]"
        />
        {children}
      </body>
    </html>
  );
}
