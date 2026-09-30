export interface Niche {
  id: string; // slug usado como subpasta: "hamburgueria"
  label: string; // nome exibido no chip: "Hamburgueria"
  emoji: string; // ícone do chip: "🍔"
  searchTerm: string; // termo enviado à busca: "hamburgueria"
  images: string[]; // arquivos em public/images/nichos/<id>/ (sem path)
}

export const NICHES: Niche[] = [
  {
    id: "hamburgueria",
    label: "Hamburgueria",
    emoji: "🍔",
    searchTerm: "hamburgueria",
    images: [
      "705-485-melhores-hamburgueria-sao-paulo.jpg",
      "Hamburgueria-Bob-BeefClassico-BurgerFoto-PFZ-StudioNorma-Lima.jpg",
      "TTBurger_021_Alta_CredTomasRangel-1.webp",
      "hob_hamburgueria_destaque_zona_sul.jpg",
      "images.jpeg",
    ],
  },
  // Nichos futuros (sem imagens ainda — array vazio)
  { id: "barbearia", label: "Barbearia", emoji: "✂️", searchTerm: "barbearia", images: [] },
  { id: "pizzaria", label: "Pizzaria", emoji: "🍕", searchTerm: "pizzaria", images: [] },
  { id: "academia", label: "Academia", emoji: "💪", searchTerm: "academia", images: [] },
  { id: "clinica", label: "Clínica", emoji: "🏥", searchTerm: "clínica", images: [] },
  { id: "salao-beleza", label: "Salão de Beleza", emoji: "💅", searchTerm: "salão de beleza", images: [] },
  { id: "restaurante", label: "Restaurante", emoji: "🍽️", searchTerm: "restaurante", images: [] },
  { id: "mecanica", label: "Mecânica", emoji: "🔧", searchTerm: "mecânica", images: [] },
];

function imagePath(nicheId: string, file: string): string {
  return `/images/nichos/${nicheId}/${file}`;
}

export function getNicheById(id: string): Niche | undefined {
  return NICHES.find((n) => n.id === id);
}

export function getRandomImage(nicheId: string): string | null {
  return getRandomImages(nicheId, 1)[0] ?? null;
}

// Até `count` imagens distintas em ordem aleatória, para os cards não repetirem foto
export function getRandomImages(nicheId: string, count: number): string[] {
  const niche = getNicheById(nicheId);
  if (!niche) return [];
  const shuffled = [...niche.images];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count).map((file) => imagePath(nicheId, file));
}
