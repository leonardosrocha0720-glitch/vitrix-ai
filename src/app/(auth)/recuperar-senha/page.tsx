"use client";

import { useState } from "react";
import Link from "next/link";
import { createRecoveryClient } from "@/lib/supabase/client";

// Primeiro acesso (convite vencido ou não recebido) e "esqueci minha senha".
export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await createRecoveryClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/confirm`,
    });
    setLoading(false);
    if (error) {
      setError("Não foi possível enviar agora. Tente de novo em alguns minutos.");
      return;
    }
    // Mesma mensagem com ou sem conta, para não revelar quais e-mails são clientes
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Vitrix <span className="text-purple-500">AI</span>
          </h1>
          <p className="text-gray-400 mt-2">Primeiro acesso ou esqueceu a senha?</p>
        </div>
        <div className="bg-[#13131A] border border-white/10 rounded-2xl p-8 space-y-4">
          {sent ? (
            <p className="text-gray-300 text-center leading-relaxed">
              Se houver uma conta com <span className="text-white font-medium">{email.trim()}</span>, enviamos um
              link para criar sua senha. Confira a caixa de entrada e o spam.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-400">
                Use o e-mail da compra. Vamos enviar um link para você criar sua senha.
              </p>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="email" className="text-sm text-gray-400 mb-1 block">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="seu@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? "Enviando..." : "Enviar link de acesso"}
              </button>
            </form>
          )}
          <p className="text-center text-gray-500 text-sm">
            <Link href="/login" className="text-purple-400 hover:text-purple-300">
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
