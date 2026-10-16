"use client";

import Link from "next/link";
import { useState } from "react";
import { PLACEHOLDER_VIDEO_ID, type Lesson } from "@/data/lessons";

type ThumbState = "loading" | "max" | "hq" | "failed";

export default function LessonCard({
  lesson,
  watched,
}: {
  lesson: Lesson;
  watched: boolean;
}) {
  const hasVideo = lesson.youtubeId !== PLACEHOLDER_VIDEO_ID;
  // maxresdefault não existe para todo vídeo; nesse caso cai para hqdefault.
  const [thumb, setThumb] = useState<ThumbState>(hasVideo ? "loading" : "failed");
  const [loaded, setLoaded] = useState(false);

  const src =
    thumb === "hq"
      ? `https://img.youtube.com/vi/${lesson.youtubeId}/hqdefault.jpg`
      : `https://img.youtube.com/vi/${lesson.youtubeId}/maxresdefault.jpg`;

  return (
    <Link
      href={`/members/aula/${lesson.id}`}
      className="members-card group block w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] outline-none hover:bg-[var(--bg-hover)]"
    >
      <div className="relative aspect-video overflow-hidden">
        {thumb !== "failed" && (
          // next/image exigiria liberar img.youtube.com no next.config.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            loading="lazy"
            ref={(el) => {
              // A imagem pode terminar de carregar antes da hidratação, sem disparar onLoad.
              if (!el?.complete || el.naturalWidth === 0) return;
              if (thumb !== "hq" && el.naturalWidth <= 120) setThumb("hq");
              else setLoaded(true);
            }}
            onLoad={(e) => {
              // Vídeo sem maxres: o YouTube devolve um cinza de 120px em vez de 404.
              if (thumb !== "hq" && e.currentTarget.naturalWidth <= 120) {
                setLoaded(false);
                setThumb("hq");
                return;
              }
              setLoaded(true);
            }}
            onError={() => {
              setLoaded(false);
              setThumb(thumb === "hq" ? "failed" : "hq");
            }}
            className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        )}

        {thumb !== "failed" && !loaded && <div className="members-skeleton absolute inset-0" />}

        {thumb === "failed" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.35),transparent_60%),linear-gradient(135deg,#1C1828,#12101A)]">
            <span className="members-title text-lg font-bold text-[var(--text-primary)]/90">
              Aula {lesson.order}
            </span>
            {!hasVideo && (
              <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Vídeo em breve
              </span>
            )}
          </div>
        )}

        {/* Escurece e mostra o play no hover. */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/40 group-focus-visible:bg-black/40">
          <span className="flex h-12 w-12 scale-75 items-center justify-center rounded-full bg-[var(--accent)] opacity-0 shadow-[0_0_24px_var(--accent-glow)] transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-white" aria-hidden>
              <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z" />
            </svg>
          </span>
        </div>

        {watched && (
          <span className="absolute left-2 top-2 rounded-md bg-[var(--accent)] px-2 py-0.5 text-[11px] font-semibold text-white shadow-[0_0_12px_var(--accent-glow)]">
            ✓ Assistido
          </span>
        )}

        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
          {lesson.duration}
        </span>
      </div>

      <div className="space-y-1 p-3">
        <h3 className="members-title line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)]">
          {lesson.title}
        </h3>
        <p className="text-xs tabular-nums text-[var(--text-secondary)]">{lesson.duration}</p>
      </div>
    </Link>
  );
}
