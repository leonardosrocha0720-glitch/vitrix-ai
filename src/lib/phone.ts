// Normaliza para DDI 55 + DDD + número, que é o formato do wa.me
export function toBrazilianE164Digits(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  return digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
}
