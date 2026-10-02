import PromptGenerator from "@/components/PromptGenerator";

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function GerarPromptPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const rating = parseFloat(first(params.rating));
  const reviewCount = parseInt(first(params.reviewCount), 10);

  return (
    <PromptGenerator
      nome={first(params.nome)}
      nicho={first(params.nicho)}
      cidade={first(params.cidade)}
      estado={first(params.estado)}
      telefone={first(params.telefone)}
      rating={Number.isFinite(rating) ? rating : undefined}
      reviewCount={Number.isFinite(reviewCount) ? reviewCount : undefined}
    />
  );
}
