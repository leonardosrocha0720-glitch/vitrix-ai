const SERPAPI_URL = "https://serpapi.com/search.json";

// Conservar créditos gratuitos (100/mês): máximo 2 páginas por busca
const MAX_PAGES = 2;

export interface RawPlace {
  place_id?: string;
  data_id?: string;
  position?: number;
  title: string;
  address?: string;
  phone?: string;
  rating?: number;
  reviews?: number;
  website?: string;
  links?: { website?: string };
}

interface SerpApiResponse {
  local_results?: RawPlace[];
  error?: string;
  serpapi_pagination?: { next?: string };
}

export interface PlacesPage {
  page: number;
  places: RawPlace[];
}

export async function* fetchPlacesPages(
  textQuery: string,
  apiKey: string,
): AsyncGenerator<PlacesPage> {
  let start = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = new URLSearchParams({
      engine: "google_maps",
      q: textQuery,
      type: "search",
      hl: "pt",
      gl: "br",
      api_key: apiKey,
      ...(start > 0 ? { start: String(start) } : {}),
    });

    const res = await fetch(`${SERPAPI_URL}?${params.toString()}`);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Erro na SerpAPI (HTTP ${res.status}): ${text}`);
    }

    const data = (await res.json()) as SerpApiResponse;

    if (data.error) {
      throw new Error(data.error);
    }

    const places = data.local_results ?? [];

    yield { page, places };

    if (places.length === 0 || !data.serpapi_pagination?.next) break;

    start += 20;
  }
}
