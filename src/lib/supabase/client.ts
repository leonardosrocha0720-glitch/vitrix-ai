import { createBrowserClient } from "@supabase/ssr";
import { createClient as createPlainClient } from "@supabase/supabase-js";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Para /auth/confirm: grava a sessão nos cookies (que o middleware lê), mas sem a
// detecção automática da URL — o @supabase/ssr força PKCE e rejeitaria os links
// de convite/recuperação, que chegam com a sessão no fragmento (#access_token=...).
export function createConfirmClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { isSingleton: false, auth: { detectSessionInUrl: false } },
  );
}

// Para pedir o link de recuperação: fluxo implícito, então o link funciona em
// qualquer aparelho (PKCE só funcionaria no mesmo navegador que pediu).
export function createRecoveryClient() {
  return createPlainClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
}
