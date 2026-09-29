export interface ColorPalette {
  id: string;
  name: string;
  primary: string; // cor principal (hex)
  secondary: string; // cor de contraste/CTA
  bg: string; // fundo claro
  text: string; // texto escuro
}

export const PALETTES: ColorPalette[] = [
  { id: "azul-corporativo", name: "Azul Corporativo", primary: "#1E3A5F", secondary: "#2A7DE1", bg: "#F5F7FA", text: "#1A1A2E" },
  { id: "verde-saude", name: "Verde Saúde", primary: "#1B5E3B", secondary: "#27AE60", bg: "#F4FAF6", text: "#1A2E1F" },
  { id: "cinza-premium", name: "Cinza Premium", primary: "#2C2C2C", secondary: "#C9A84C", bg: "#F8F8F8", text: "#1A1A1A" },
  { id: "bordô-elegante", name: "Bordô Elegante", primary: "#6B1A2A", secondary: "#C0392B", bg: "#FAF5F5", text: "#2E1A1A" },
  { id: "azul-moderno", name: "Azul Moderno", primary: "#0A2540", secondary: "#00B4D8", bg: "#F0F8FF", text: "#0A1628" },
  { id: "verde-oliva", name: "Verde Oliva", primary: "#3D5A3E", secondary: "#8DB38B", bg: "#F6F8F4", text: "#1E2D1F" },
];
