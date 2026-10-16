"use client";

import { useMemo, useState } from "react";
import { getSortedLessons } from "@/data/lessons";
import MembersHero from "@/components/members/MembersHero";
import LessonCard from "@/components/members/LessonCard";
import { useWatchedLessons } from "@/components/members/useWatchedLessons";

const allLessons = getSortedLessons();

/** Minúsculas e sem acento: "introdução" acha "introducao" e vice-versa. */
function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function MembersPage() {
  const [query, setQuery] = useState("");
  const { watched, isWatched } = useWatchedLessons();

  const term = normalize(query.trim());
  const visible = useMemo(
    () =>
      term
        ? allLessons.filter((lesson) => normalize(`${lesson.title} ${lesson.description}`).includes(term))
        : allLessons,
    [term],
  );

  // Conta só ids que ainda existem em lessons.ts (aulas removidas não inflam o total).
  const watchedCount = allLessons.filter((lesson) => watched.has(lesson.id)).length;

  return (
    <main className="pb-20">
      <MembersHero
        query={query}
        onQueryChange={setQuery}
        watchedCount={watchedCount}
        totalCount={allLessons.length}
      />

      <section
        className="members-fade-in mx-auto max-w-5xl px-4 pt-10 sm:px-6"
        style={{ "--delay": "150ms" } as React.CSSProperties}
      >
        <h2 className="members-title mb-6 text-lg font-bold text-[var(--text-primary)]">
          {term ? (
            <>
              {visible.length === 0
                ? "Nenhuma aula encontrada"
                : `${visible.length} ${visible.length === 1 ? "aula encontrada" : "aulas encontradas"}`}
              <span className="font-normal text-[var(--text-secondary)]"> para “{query.trim()}”</span>
            </>
          ) : (
            "Aulas"
          )}
        </h2>

        {visible.length === 0 ? (
          <p className="text-[var(--text-secondary)]">Tente outro termo, como “site” ou “busca”.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {visible.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} watched={isWatched(lesson.id)} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
