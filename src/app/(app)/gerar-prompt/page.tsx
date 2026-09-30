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

  return (
    <PromptGenerator
      nome={first(params.nome)}
      nicho={first(params.nicho)}
      cidade={first(params.cidade)}
      telefone={first(params.telefone)}
    />
  );
}
