"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/clientes");
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Vitrix <span className="text-purple-500">AI</span>
          </h1>
          <p className="text-gray-400 mt-2">Crie sua conta — 50 créditos grátis</p>
        </div>
        <form
          onSubmit={handleRegister}
          className="bg-[#13131A] border border-white/10 rounded-2xl p-8 space-y-4"
        >
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm text-gray-400 mb-1 block">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="mínimo 6 caracteres"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Criando conta..." : "Criar conta grátis"}
          </button>
          <p className="text-center text-gray-500 text-sm">
            Já tem conta?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
