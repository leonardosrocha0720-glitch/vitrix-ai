"use client";

import Link from "next/link";
import type { Lesson } from "@/data/lessons";
import { useWatchedLessons } from "./useWatchedLessons";

/** Lista de todas as aulas: sidebar no desktop, bloco abaixo do conteúdo no mobile. */
export default function LessonList({
  lessons,
  currentLessonId,
}: {
  lessons: Lesson[];
  currentLessonId: string;
}) {
  const { isWatched } = useWatchedLessons();
  const done = lessons.filter((l) => isWatched(l.id)).length;

  return (
    <div className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="border-b border-[var(--border)] px-4 py-4">
        <h2 className="members-title font-bold text-[var(--text-primary)]">Aulas</h2>
        <p className="mt-1 text-xs tabular-nums text-[var(--text-secondary)]">
          {done} de {lessons.length} aulas concluídas
        </p>
      </div>

      <ol className="p-2">
        {lessons.map((lesson) => {
          const current = lesson.id === currentLessonId;
          const seen = isWatched(lesson.id);
          return (
            <li key={lesson.id}>
              <Link
                href={`/members/aula/${lesson.id}`}
                aria-current={current ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  current
                    ? "bg-[var(--accent)]/20 ring-1 ring-[var(--accent)]"
                    : "hover:bg-[var(--bg-hover)]"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                    current
                      ? "bg-[var(--accent)] text-white"
                      : seen
                        ? "bg-[var(--accent)]/25 text-[var(--accent-bright)]"
                        : "bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                  }`}
                >
                  {seen && !current ? "✓" : lesson.order}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm ${
                      current ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-primary)]/85"
                    }`}
                  >
                    {lesson.title}
                  </span>
                  <span className="block text-xs tabular-nums text-[var(--text-secondary)]">
                    {lesson.duration}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
