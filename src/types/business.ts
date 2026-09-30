export interface Business {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  rating: number | null;
  reviewCount: number;
  website: string | null;
  mapsUrl: string;
}

export type TipoCTA = "whatsapp" | "ligar" | "formulario";

// Dados coletados no BusinessDataModal antes de gerar o site
export interface BusinessExtraData {
  telefone?: string;
  horario?: string;
  diferencial?: string;
  servicos?: string;
  tipoCTA?: TipoCTA;
}

export type SiteFilter = "all" | "no-site" | "with-site";

export interface SearchFormValues {
  niche: string; // termo enviado à busca (searchTerm do nicho)
  nicheId: string; // id em src/lib/niches.ts — escolhe o banco de imagens do site
  city: string;
  state: string;
  minRating: number;
  maxRating: number;
  minReviews: number;
  siteFilter: SiteFilter;
  maxResults: number;
}

export type SearchEvent =
  | { type: "progress"; message: string; page: number }
  | { type: "done"; results: Business[]; totalFound: number }
  | { type: "error"; message: string };
