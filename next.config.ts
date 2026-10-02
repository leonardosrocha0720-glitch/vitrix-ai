import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // generate-site lê o banco de imagens de public/ com fs para embutir em base64.
  // Arquivos de public/ não entram no bundle da função sozinhos na Vercel.
  outputFileTracingIncludes: {
    "/api/generate-site": ["./public/images/nichos/**/*"],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/landing.html",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
