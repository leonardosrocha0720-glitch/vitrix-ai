import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ColorPalette } from "@/lib/palettes";
import type { TipoCTA } from "@/types/business";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface SiteJsonData {
  metaDescricao: string;
  tituloHero: string;
  subtituloHero: string;
  tituloSobre: string;
  textoSobre1: string;
  textoSobre2: string;
  tituloServicos: string;
  servicos: Array<{ nome: string; descricao: string; preco?: string }>;
  tituloDiferenciais: string;
  diferenciais: Array<{ titulo: string; descricao: string }>;
  depoimentos: Array<{ nome: string; local: string; texto: string }>;
  tituloCta: string;
  subtituloCta: string;
}

export interface TemplateData {
  json: SiteJsonData;
  nomeNegocio: string;
  nicho: string;
  cidade?: string;
  endereco: string;
  telefone: string;
  horario?: string;
  rating?: number | null;
  reviewCount?: number;
  palette: ColorPalette;
  tipoCTA: TipoCTA;
  ctaHref: string;
  ctaLabel: string;
  /** Imagens do nicho já convertidas para data URI (base64) */
  nicheImageDataUris: string[];
  /** Imagem "Sobre nós" — URL do Unsplash ou data URI */
  aboutImageSrc?: string;
}

// ─── SVGs dos ícones de CTA ───────────────────────────────────────────────────

const CTA_ICON_SVG: Record<TipoCTA, string> = {
  whatsapp: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.532 5.856L.06 23.508a.5.5 0 0 0 .614.614l5.652-1.472A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.516-5.18-1.415l-.37-.22-3.834.998 1.018-3.725-.24-.386A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>`,
  ligar: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  formulario: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
};

// ─── Helpers HTML ─────────────────────────────────────────────────────────────

function starsHtml(count = 5): string {
  return Array(count).fill(
    `<svg class="w-4 h-4" viewBox="0 0 20 20" fill="#FBBF24"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`
  ).join("");
}

function serviceCardHtml(
  servico: { nome: string; descricao: string; preco?: string },
  imageDataUri: string | null,
  primaryColor: string,
  secondaryColor: string,
): string {
  const imgHtml = imageDataUri
    ? `<img src="${imageDataUri}" alt="${servico.nome}" loading="lazy" class="w-full h-48 object-cover" />`
    : `<div class="w-full h-14 flex items-center justify-center" style="color:${primaryColor}">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
       </div>`;

  const precoHtml = servico.preco
    ? `<span class="text-sm font-heading font-semibold mt-2 block" style="color:${secondaryColor}">${servico.preco}</span>`
    : "";

  return `<div class="card-hover bg-white rounded-2xl overflow-hidden shadow-md">
  ${imgHtml}
  <div class="p-5">
    <h3 class="font-heading font-bold text-lg text-primary mb-2">${servico.nome}</h3>
    <p class="text-gray-500 text-sm leading-relaxed">${servico.descricao}</p>
    ${precoHtml}
  </div>
</div>`;
}

function diferencialCardHtml(
  d: { titulo: string; descricao: string },
  primaryColor: string,
): string {
  return `<div class="card-hover text-center p-6 rounded-2xl bg-white shadow-sm border border-gray-100">
  <div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style="background:${primaryColor}1a">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${primaryColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  </div>
  <h3 class="font-heading font-bold text-base text-primary mb-2">${d.titulo}</h3>
  <p class="text-gray-500 text-sm leading-relaxed">${d.descricao}</p>
</div>`;
}

function depoimentoCardHtml(d: { nome: string; local: string; texto: string }): string {
  return `<div class="card-hover bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
  <div class="flex gap-1 mb-3">${starsHtml()}</div>
  <p class="text-gray-600 text-sm leading-relaxed mb-4">"${d.texto}"</p>
  <div>
    <p class="font-heading font-semibold text-sm text-gray-800">${d.nome}</p>
    <p class="text-gray-400 text-xs">${d.local}</p>
  </div>
</div>`;
}

// ─── Função principal ─────────────────────────────────────────────────────────

export async function buildHtmlFromTemplate(
  templateName: string,
  data: TemplateData,
): Promise<string> {
  const templatePath = path.join(process.cwd(), "src", "templates", `${templateName}.html`);
  let html = await readFile(templatePath, "utf-8");

  const { json, palette, tipoCTA, ctaHref, ctaLabel, nicheImageDataUris, aboutImageSrc } = data;
  const ctaTarget = tipoCTA === "whatsapp" ? 'target="_blank" rel="noopener"' : "";
  const ctaIconSvg = CTA_ICON_SVG[tipoCTA] ?? "";

  // Paleta
  html = html
    .replaceAll("{{PRIMARY}}", palette.primary)
    .replaceAll("{{SECONDARY}}", palette.secondary)
    .replaceAll("{{BG}}", palette.bg)
    .replaceAll("{{TEXT}}", palette.text);

  // Dados básicos
  html = html
    .replaceAll("{{NOME_NEGOCIO}}", data.nomeNegocio)
    .replaceAll("{{NICHO}}", data.nicho)
    .replaceAll("{{CIDADE}}", data.cidade ?? "")
    .replaceAll("{{ENDERECO}}", data.endereco)
    .replaceAll("{{ANO}}", String(new Date().getFullYear()));

  // Telefone
  const telExibicao = data.telefone || "Não informado";
  const telHref = data.telefone ? `tel:${data.telefone.replace(/\D/g, "").startsWith("55") ? "+" : "+55"}${data.telefone.replace(/\D/g, "")}` : "#";
  html = html
    .replaceAll("{{TELEFONE_EXIBICAO}}", telExibicao)
    .replaceAll("{{TEL_HREF}}", telHref);

  // Horário no footer
  const horarioFooter = data.horario
    ? `<p class="mt-1">${data.horario}</p>`
    : "";
  html = html.replaceAll("{{HORARIO_FOOTER}}", horarioFooter);

  // CTA
  html = html
    .replaceAll("{{CTA_HREF}}", ctaHref)
    .replaceAll("{{CTA_TARGET}}", ctaTarget)
    .replaceAll("{{CTA_LABEL}}", ctaLabel)
    .replaceAll("{{CTA_ICONE_SVG}}", ctaIconSvg);

  // Google Maps
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.nomeNegocio} ${data.endereco}`)}`;
  html = html.replaceAll("{{MAPS_URL}}", mapsUrl);

  // Selo Google no hero (condicional)
  const seloGoogle = data.rating
    ? `<div class="anim-4 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
        <div class="flex gap-0.5">${starsHtml()}</div>
        <span class="text-white/90 text-sm font-medium">${data.rating.toFixed(1)} no Google · ${data.reviewCount ?? 0} avaliações</span>
       </div>`
    : "";
  html = html.replaceAll("{{SELO_GOOGLE}}", seloGoogle);

  // Nota Google na seção depoimentos
  const notaGoogle = data.rating
    ? `<p class="text-gray-500 mt-2 text-sm">${data.rating.toFixed(1)} no Google · ${data.reviewCount ?? 0} avaliações</p>`
    : "";
  html = html.replaceAll("{{NOTA_GOOGLE}}", notaGoogle);

  // Conteúdo do JSON
  html = html
    .replaceAll("{{META_DESCRICAO}}", json.metaDescricao)
    .replaceAll("{{TITULO_HERO}}", json.tituloHero)
    .replaceAll("{{SUBTITULO_HERO}}", json.subtituloHero)
    .replaceAll("{{TITULO_SOBRE}}", json.tituloSobre)
    .replaceAll("{{TEXTO_SOBRE_1}}", json.textoSobre1)
    .replaceAll("{{TEXTO_SOBRE_2}}", json.textoSobre2)
    .replaceAll("{{TITULO_SERVICOS}}", json.tituloServicos)
    .replaceAll("{{TITULO_DIFERENCIAIS}}", json.tituloDiferenciais)
    .replaceAll("{{TITULO_CTA}}", json.tituloCta)
    .replaceAll("{{SUBTITULO_CTA}}", json.subtituloCta);

  // Imagem Sobre
  const aboutSrc = aboutImageSrc ?? (nicheImageDataUris[0] ?? "");
  html = html.replaceAll("{{IMAGEM_SOBRE}}", aboutSrc);

  // Cards de serviços (imagens do nicho, 1 por card)
  const cardsServicos = json.servicos
    .map((s, i) =>
      serviceCardHtml(s, nicheImageDataUris[i] ?? null, palette.primary, palette.secondary)
    )
    .join("\n");
  html = html.replaceAll("{{CARDS_SERVICOS}}", cardsServicos);

  // Cards de diferenciais
  const cardsDiferenciais = json.diferenciais
    .map((d) => diferencialCardHtml(d, palette.primary))
    .join("\n");
  html = html.replaceAll("{{CARDS_DIFERENCIAIS}}", cardsDiferenciais);

  // Cards de depoimentos
  const cardsDepoimentos = json.depoimentos
    .map((d) => depoimentoCardHtml(d))
    .join("\n");
  html = html.replaceAll("{{CARDS_DEPOIMENTOS}}", cardsDepoimentos);

  // Botão flutuante WhatsApp
  const whatsappDigits = data.telefone?.replace(/\D/g, "").startsWith("55")
    ? data.telefone.replace(/\D/g, "")
    : `55${data.telefone?.replace(/\D/g, "") ?? ""}`;
  const whatsappHref = data.telefone
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Olá! Vim pelo site e gostaria de mais informações.")}`
    : null;

  let botaoFlutuante = "";
  if (tipoCTA === "ligar" && data.telefone) {
    botaoFlutuante = `<a href="${telHref}" aria-label="Ligar" class="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110" style="background:${palette.primary}">${CTA_ICON_SVG.ligar.replace('stroke="currentColor"', 'stroke="white"')}</a>`;
  } else if (whatsappHref) {
    botaoFlutuante = `<a href="${whatsappHref}" target="_blank" rel="noopener" aria-label="WhatsApp" class="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110" style="background:#25D366">${CTA_ICON_SVG.whatsapp}</a>`;
  }
  html = html.replaceAll("{{BOTAO_FLUTUANTE}}", botaoFlutuante);

  return html;
}
