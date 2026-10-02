export interface Country {
  code: string; // parâmetro gl da SerpAPI
  label: string;
  hl: string; // idioma dos resultados (parâmetro hl da SerpAPI)
}

export const DEFAULT_COUNTRY = "br";

export const COUNTRIES: Country[] = [
  { code: "br", label: "Brasil", hl: "pt" },
  { code: "us", label: "Estados Unidos", hl: "en" },
  { code: "pt", label: "Portugal", hl: "pt" },
  { code: "es", label: "Espanha", hl: "es" },
  { code: "mx", label: "México", hl: "es" },
  { code: "ar", label: "Argentina", hl: "es" },
  { code: "co", label: "Colômbia", hl: "es" },
  { code: "cl", label: "Chile", hl: "es" },
];

// Código desconhecido cai no Brasil, para a busca nunca sair sem gl/hl válidos
export function getCountry(code: string | undefined): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}
