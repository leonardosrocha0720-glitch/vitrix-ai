/** Os 27 estados brasileiros, ordenados pelo nome. */
export const BR_STATES = [
  { uf: "AC", name: "Acre" },
  { uf: "AL", name: "Alagoas" },
  { uf: "AP", name: "Amapá" },
  { uf: "AM", name: "Amazonas" },
  { uf: "BA", name: "Bahia" },
  { uf: "CE", name: "Ceará" },
  { uf: "DF", name: "Distrito Federal" },
  { uf: "ES", name: "Espírito Santo" },
  { uf: "GO", name: "Goiás" },
  { uf: "MA", name: "Maranhão" },
  { uf: "MT", name: "Mato Grosso" },
  { uf: "MS", name: "Mato Grosso do Sul" },
  { uf: "MG", name: "Minas Gerais" },
  { uf: "PA", name: "Pará" },
  { uf: "PB", name: "Paraíba" },
  { uf: "PR", name: "Paraná" },
  { uf: "PE", name: "Pernambuco" },
  { uf: "PI", name: "Piauí" },
  { uf: "RJ", name: "Rio de Janeiro" },
  { uf: "RN", name: "Rio Grande do Norte" },
  { uf: "RS", name: "Rio Grande do Sul" },
  { uf: "RO", name: "Rondônia" },
  { uf: "RR", name: "Roraima" },
  { uf: "SC", name: "Santa Catarina" },
  { uf: "SP", name: "São Paulo" },
  { uf: "SE", name: "Sergipe" },
  { uf: "TO", name: "Tocantins" },
] as const;

export const stateName = (uf: string) => BR_STATES.find((s) => s.uf === uf)?.name ?? uf;

const citiesCache = new Map<string, string[]>();

/** Municípios do estado (API pública do IBGE), em ordem alfabética. Cacheado por UF. */
export async function fetchCities(uf: string, signal?: AbortSignal): Promise<string[]> {
  const cached = citiesCache.get(uf);
  if (cached) return cached;

  const res = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
    { signal },
  );
  if (!res.ok) throw new Error(`IBGE ${res.status}`);
  const data = (await res.json()) as { nome: string }[];
  const names = data.map((m) => m.nome).sort((a, b) => a.localeCompare(b, "pt-BR"));
  citiesCache.set(uf, names);
  return names;
}
