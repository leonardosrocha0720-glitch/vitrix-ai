"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createConfirmClient } from "@/lib/supabase/client";

// Destino dos links de e-mail (convite pós-compra e recuperação de senha).
// Abre a sessão a partir da URL e manda a pessoa criar/trocar a senha.
export default function ConfirmPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function confirm() {
      const supabase = createConfirmClient();
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const query = new URLSearchParams(window.location.search);

      if (hash.get("error") || query.get("error")) {
        setError("Este link expirou ou já foi usado.");
        return;
      }

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const code = query.get("code");

      let failed = true;
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        failed = Boolean(error);
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        failed = Boolean(error);
      }

      if (failed) {
        setError("Não foi possível validar este link. Peça um novo abaixo.");
        return;
      }

      // Navegação completa: tira os tokens da URL e a próxima página já
      // encontra a sessão nos cookies.
      window.location.replace("/definir-senha");
    }

    confirm();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-white">
          Vitrix <span className="text-purple-500">AI</span>
        </h1>
        <div className="mt-8 bg-[#13131A] border border-white/10 rounded-2xl p-8">
          {error ? (
            <>
              <p className="text-red-400">{error}</p>
              <Link
                href="/recuperar-senha"
                className="mt-6 inline-block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Receber um novo link
              </Link>
            </>
          ) : (
            <p className="text-gray-400">Validando seu acesso…</p>
          )}
        </div>
      </div>
    </div>
  );
}
