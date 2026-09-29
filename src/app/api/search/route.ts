import type { NextRequest } from "next/server";
import { fetchPlacesPages } from "@/lib/googlePlaces";
import { mapPlaceToBusiness } from "@/lib/mapBusiness";
import type { Business, SearchEvent, SearchFormValues } from "@/types/business";

export const runtime = "nodejs";

function applyFilters(businesses: Business[], params: SearchFormValues): Business[] {
  return businesses.filter((b) => {
    if (b.rating === null) return false;
    if (b.rating < params.minRating || b.rating > params.maxRating) return false;
    if (b.reviewCount < params.minReviews) return false;
    if (params.siteFilter === "no-site" && b.website) return false;
    if (params.siteFilter === "with-site" && !b.website) return false;
    return true;
  });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.SERPAPI_KEY;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SearchEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        if (!apiKey) {
          send({
            type: "error",
            message:
              "SERPAPI_KEY não configurada no servidor. Defina a variável de ambiente e reinicie o app.",
          });
          return;
        }

        const params = (await req.json()) as SearchFormValues;

        if (!params.niche?.trim() || !params.city?.trim()) {
          send({ type: "error", message: "Informe ao menos o nicho e a cidade para buscar." });
          return;
        }

        const location = params.state?.trim()
          ? `${params.city}, ${params.state}`
          : params.city;
        const textQuery = `${params.niche} em ${location}`;

        send({ type: "progress", message: `Buscando "${textQuery}"...`, page: 0 });

        const allBusinesses: Business[] = [];
        for await (const { page, places } of fetchPlacesPages(textQuery, apiKey)) {
          allBusinesses.push(...places.map(mapPlaceToBusiness));
          send({
            type: "progress",
            message: `Página ${page}: ${places.length} resultado(s) recebido(s) (total ${allBusinesses.length})...`,
            page,
          });
        }

        send({ type: "progress", message: "Aplicando filtros...", page: -1 });
        const filtered = applyFilters(allBusinesses, params);

        send({ type: "done", results: filtered, totalFound: allBusinesses.length });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Erro inesperado ao buscar negócios.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
