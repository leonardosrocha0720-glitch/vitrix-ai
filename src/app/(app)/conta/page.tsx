"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  email: string;
  credits: number;
  plan: string;
  created_at: string;
}

export default function ContaPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) setProfile(data);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-8 pt-20 lg:pt-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-2">Minha Conta</h2>
      <p className="text-gray-400 mb-8">Gerencie seus créditos e plano</p>

      <div className="bg-[#13131A] border border-white/10 rounded-2xl p-6 mb-6">
        <h3 className="text-white font-semibold mb-4">Informações da Conta</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-gray-400 text-sm">Email</span>
            <span className="text-white text-sm">{profile?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-gray-400 text-sm">Plano</span>
            <span className="bg-purple-600/20 text-purple-400 text-xs px-3 py-1 rounded-full capitalize">
              {profile?.plan}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-400 text-sm">Membro desde</span>
            <span className="text-white text-sm">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("pt-BR")
                : "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#13131A] border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Créditos</h3>
          <span className="text-3xl font-bold text-purple-400">{profile?.credits}</span>
        </div>
        <p className="text-gray-500 text-sm mb-4">
          Cada site gerado consome 1 crédito. Você recebeu 50 créditos grátis ao criar sua conta.
        </p>
        <div className="w-full bg-[#1A1A24] rounded-full h-2 mb-4">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(100, ((profile?.credits ?? 0) / 50) * 100)}%` }}
          />
        </div>
      </div>

      <div className="bg-[#13131A] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Comprar Créditos</h3>
        <div className="grid gap-3">
          {[
            { credits: 50, price: "R$ 29,90", highlight: false },
            { credits: 150, price: "R$ 59,90", highlight: true },
            { credits: 500, price: "R$ 149,90", highlight: false },
          ].map((pack) => (
            <div
              key={pack.credits}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                pack.highlight
                  ? "border-purple-500/50 bg-purple-600/10"
                  : "border-white/10 bg-[#1A1A24]"
              }`}
            >
              <div>
                <p className="text-white font-medium">{pack.credits} créditos</p>
                {pack.highlight && <p className="text-purple-400 text-xs">Mais popular</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white font-bold">{pack.price}</span>
                <button className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                  Comprar
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-3 text-center">Pagamento via Stripe — em breve</p>
      </div>
    </div>
  );
}
