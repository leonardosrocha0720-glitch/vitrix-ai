"use client";

import { useEffect } from "react";
import { PLACEHOLDER_VIDEO_ID } from "@/data/lessons";
import { markLessonWatched } from "./useWatchedLessons";

export default function VideoPlayer({
  youtubeId,
  title,
  lessonId,
}: {
  youtubeId: string;
  title: string;
  /** A aula é marcada como assistida assim que o player monta. */
  lessonId: string;
}) {
  useEffect(() => {
    markLessonWatched(lessonId);
  }, [lessonId]);

  const hasVideo = youtubeId !== PLACEHOLDER_VIDEO_ID;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[12px] border border-[var(--border)] bg-black shadow-[0_0_40px_rgba(124,58,237,0.15)]">
      {hasVideo ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_50%_40%,rgba(124,58,237,0.3),transparent_65%),linear-gradient(135deg,#1C1828,#0A0A0F)] px-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-hover)]">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-[var(--accent-bright)]" aria-hidden>
              <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z" />
            </svg>
          </span>
          <p className="members-title text-lg font-semibold text-[var(--text-primary)]">Vídeo em breve</p>
          <p className="max-w-sm text-sm text-[var(--text-secondary)]">
            Esta aula ainda está sendo gravada. Volte em breve.
          </p>
        </div>
      )}
    </div>
  );
}
