/**
 * Radar de varredura. A ferramenta varre uma cidade atrás de sinal, então o
 * indicador de progresso é um radar e não um spinner genérico.
 *
 * Em tamanho grande a fatia cônica sozinha lê como gráfico de pizza — por isso
 * os anéis, a cruzeta e o ponto central: é o que faz o desenho virar radar.
 */
export default function Radar({ size = "lg" }: { size?: "md" | "lg" }) {
  const outer = size === "lg" ? "h-20 w-20" : "h-12 w-12";
  const face = size === "lg" ? "h-16 w-16" : "h-9 w-9";

  return (
    <span className={`relative grid shrink-0 place-items-center ${outer}`} aria-hidden>
      <span className="radar-ping absolute inset-0 rounded-full border border-brand/40" />
      <span className={`relative overflow-hidden rounded-full border border-brand/30 ${face}`}>
        <span className="absolute inset-[26%] rounded-full border border-brand/20" />
        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-brand/15" />
        <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-brand/15" />
        <span className="radar-sweep radar-sweep-lg absolute inset-0" />
        <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-2 shadow-[0_0_6px_var(--color-brand)]" />
      </span>
    </span>
  );
}
