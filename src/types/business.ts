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

export type SiteFilter = "all" | "no-site" | "with-site";

export interface SearchFormValues {
  niche: string;
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
