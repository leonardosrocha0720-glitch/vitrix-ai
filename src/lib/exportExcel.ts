import * as XLSX from "xlsx";
import type { Business } from "@/types/business";

export function exportBusinessesToExcel(businesses: Business[], fileName = "prospeccao") {
  const rows = businesses.map((b) => ({
    Nome: b.name,
    Endereço: b.address,
    Telefone: b.phone ?? "",
    Avaliação: b.rating ?? "",
    "Nº de Avaliações": b.reviewCount,
    Site: b.website ?? "SEM SITE",
    "Link Google Maps": b.mapsUrl,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 32 },
    { wch: 42 },
    { wch: 16 },
    { wch: 10 },
    { wch: 16 },
    { wch: 32 },
    { wch: 42 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${fileName}-${date}.xlsx`);
}
