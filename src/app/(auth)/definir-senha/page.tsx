"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, createConfirmClient } from "@/lib/supabase/client";

const MIN_LENGTH = 8;

// Destino do link de recuperação de senha (token no fragmento: #access_token=...&type=recovery)
// e do redirect de /auth/confirm (sessão já nos cookies). Primeiro acesso ou troca de senha.
export default function DefinirSenhaPage() {
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const supabase = createConfirmClient();
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const query = new URLSearchParams(window.location.search);
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const code = query.get("code");

      if (hash.get("error") || query.get("error")) {
        setInvalidLink(true);
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setInvalidLink(true);
          return;
        }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setInvalidLink(true);
          return;
        }
      } else {
        // Sem token na URL: só vale se já houver sessão (vinda de /auth/confirm).
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setInvalidLink(true);
          return;
        }
      }

      // Tira os tokens da barra de endereço.
      window.history.replaceState(null, "", window.location.pathname);
      setReady(true);
    }

    init();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < MIN_LENGTH) {
      setError(`A senha precisa ter pelo menos ${MIN_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/clientes");
    router.refresh();
  }

  const inputClass =
    "w-full bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors";

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Vitrix <span className="text-purple-500">AI</span>
          </h1>
          <p className="text-gray-400 mt-2">Crie sua senha de acesso</p>
        </div>
        {invalidLink ? (
          <div className="bg-[#13131A] border border-white/10 rounded-2xl p-8 space-y-4 text-center">
            <p className="text-red-400 text-sm">Este link expirou ou já foi usado.</p>
            <Link href="/recuperar-senha" className="text-purple-400 hover:text-purple-300 text-sm">
              Pedir um novo link
            </Link>
          </div>
        ) : !ready ? (
          <p className="text-center text-gray-400 text-sm">Validando link...</p>
        ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-[#13131A] border border-white/10 rounded-2xl p-8 space-y-4"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="password" className="text-sm text-gray-400 mb-1 block">
              Nova senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
              placeholder={`Mínimo de ${MIN_LENGTH} caracteres`}
            />
          </div>
          <div>
            <label htmlFor="confirm" className="text-sm text-gray-400 mb-1 block">
              Confirme a senha
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Salvando..." : "Salvar e entrar"}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
