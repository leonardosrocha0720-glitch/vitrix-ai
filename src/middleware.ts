import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Rotas públicas: login, register, callback, /auth/confirm (links de e-mail),
  // /recuperar-senha, /landing.html (página de vendas), /s/* (sites publicados)
  // e /api/webhook/* — webhooks vêm de servidores externos, sem sessão Supabase.
  // Esses endpoints fazem a própria autenticação via secret (APLIFAY_WEBHOOK_SECRET).
  const publicPaths = [
    "/login",
    "/register",
    "/auth/callback",
    "/auth/confirm",
    "/recuperar-senha",
    "/landing.html",
    "/api/webhook/",
  ];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p)) || pathname.startsWith("/s/");

  if (!user && !isPublic) {
    // Rotas de API respondem JSON: um redirect quebraria o res.json() do cliente.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && (pathname === "/login" || pathname === "/register" || pathname === "/")) {
    return NextResponse.redirect(new URL("/clientes", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
