import type { ColorPalette } from "@/lib/palettes";
import type { TipoCTA } from "@/types/business";
import { toBrazilianE164Digits } from "@/lib/phone";

export interface SitePromptInput {
  nome: string;
  nicho: string;
  cidade: string;
  telefone: string;
  horario: string;
  servicos: string;
  diferencial: string;
  tipoCTA: TipoCTA;
  palette: ColorPalette;
}

const WHATSAPP_TEXT = "Olá, vim pelo site e gostaria de mais informações";

function ctaInstruction(tipoCTA: TipoCTA, telefone: string): string {
  const digits = toBrazilianE164Digits(telefone);
  if (tipoCTA === "ligar") return `href="tel:+${digits}"`;
  if (tipoCTA === "formulario") {
    return `href="#contato" (âncora para uma seção com id="contato" contendo um formulário simples)`;
  }
  return `href="https://wa.me/${digits}?text=${encodeURIComponent(WHATSAPP_TEXT)}"`;
}

// Prompt para colar no Google AI Studio e gerar o site fora da ferramenta
export function buildSitePrompt(input: SitePromptInput): string {
  const { nome, nicho, cidade, telefone, horario, servicos, diferencial, tipoCTA, palette } = input;

  return `Você é um desenvolvedor web especialista em criar landing pages modernas e de alta conversão.

Crie um site one-page completo em HTML para o seguinte negócio:

**Dados do negócio:**
- Nome: ${nome}
- Nicho: ${nicho}
- Cidade: ${cidade || "não informada"}
- Telefone/WhatsApp: ${telefone}
- Horário: ${horario || "não informado"}
- Serviços: ${servicos || "use serviços típicos do nicho"}
- Diferencial: ${diferencial || "use diferenciais típicos do nicho"}

**Paleta de cores:**
- Cor primária: ${palette.primary}
- Cor secundária: ${palette.secondary}

**Estrutura obrigatória do site:**
1. Header fixo com nome do negócio e botão CTA
2. Hero com título impactante, subtítulo e botão CTA principal
3. Seção "Nossos Serviços" com cards (ícones SVG inline)
4. Seção "Por que nos escolher" com 3 diferenciais e ícones
5. Seção de 2 depoimentos fictícios mas realistas para o nicho
6. CTA final com fundo na cor primária
7. Footer com horário, endereço genérico e contato

**Requisitos técnicos:**
- Tailwind CSS via CDN (https://cdn.tailwindcss.com)
- Animações com CSS puro @keyframes — ZERO bibliotecas JS externas
- Mobile-first, totalmente responsivo
- Botão CTA principal: ${ctaInstruction(tipoCTA, telefone)}
- Todo o site em um único arquivo HTML
- Retorne APENAS o código HTML, sem explicações, sem markdown`;
}
