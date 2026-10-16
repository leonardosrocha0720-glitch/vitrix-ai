/**
 * Conteúdo da Área de Membros (/members).
 *
 * Tudo aqui é estático: não há banco nem API. Para publicar uma aula nova
 * basta editar este arquivo e fazer deploy.
 *
 * COMO ADICIONAR UMA AULA
 * 1. Acrescente um objeto ao array `lessons` abaixo.
 * 2. `id` precisa ser único (vira a URL /members/aula/{id}).
 *    Use slug minúsculo com hífens, ex.: "exportando-para-excel".
 * 3. `order` define a posição no grid e na sequência anterior/próxima (1, 2, 3...).
 * 4. `youtubeId` é o trecho depois de "v=" no link do YouTube.
 *    Ex.: https://www.youtube.com/watch?v=dQw4w9WgXcQ → "dQw4w9WgXcQ".
 *    Enquanto o vídeo não existir, deixe "PLACEHOLDER": o card e o player
 *    mostram um aviso de "em breve" no lugar da thumbnail/vídeo.
 * 5. `duration` é só texto exibido no card, no formato "mm:ss".
 *
 * Não altere o `id` de uma aula já publicada: o progresso dos alunos fica
 * salvo no navegador pelo id, e a URL antiga deixaria de existir.
 */

export interface Lesson {
  id: string; // slug único ex: "introducao-vitrix"
  title: string;
  description: string;
  youtubeId: string; // ID do YouTube ex: "dQw4w9WgXcQ"
  duration: string; // ex: "12:34"
  order: number;
}

/** Valor usado em `youtubeId` enquanto o vídeo ainda não foi gravado. */
export const PLACEHOLDER_VIDEO_ID = "PLACEHOLDER";

export const lessons: Lesson[] = [
  {
    id: "introducao-vitrix",
    title: "Boas-vindas à Vitrix AI",
    description:
      "Uma visão geral da ferramenta: como ela encontra negócios locais sem site, gera um site pronto com IA e te ajuda a transformar isso em venda.",
    youtubeId: PLACEHOLDER_VIDEO_ID,
    duration: "06:12",
    order: 1,
  },
  {
    id: "criando-o-primeiro-site",
    title: "Criando o primeiro site",
    description:
      "Da busca ao site pronto: encontre um negócio sem site, clique em \"Criar site\" e gere um site completo para apresentar ao cliente.",
    youtubeId: PLACEHOLDER_VIDEO_ID,
    duration: "14:32",
    order: 2,
  },
];

/** Aulas na ordem de exibição. */
export function getSortedLessons(): Lesson[] {
  return [...lessons].sort((a, b) => a.order - b.order);
}

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

/** Aula anterior e próxima na sequência. */
export function getAdjacentLessons(id: string): { prev?: Lesson; next?: Lesson } {
  const all = getSortedLessons();
  const i = all.findIndex((l) => l.id === id);
  if (i === -1) return {};
  return { prev: all[i - 1], next: all[i + 1] };
}
