"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MIN_LENGTH = 8;

// Chega aqui logado (via /auth/confirm). Primeiro acesso de quem comprou ou troca de senha.
export default function DefinirSenhaPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      </div>
    </div>
  );
}
