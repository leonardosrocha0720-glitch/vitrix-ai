import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdjacentLessons, getLessonById, getSortedLessons } from "@/data/lessons";
import BreadcrumbNav from "@/components/members/BreadcrumbNav";
import VideoPlayer from "@/components/members/VideoPlayer";
import LessonList from "@/components/members/LessonList";

type Props = { params: Promise<{ lessonId: string }> };

export function generateStaticParams() {
  return getSortedLessons().map((lesson) => ({ lessonId: lesson.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = getLessonById(lessonId);
  return { title: lesson ? lesson.title : "Aula não encontrada" };
}

export default async function LessonPage({ params }: Props) {
  const { lessonId } = await params;
  const lesson = getLessonById(lessonId);
  if (!lesson) notFound();

  const { prev, next } = getAdjacentLessons(lesson.id);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-10">
      <div className="members-fade-in">
        <BreadcrumbNav
          items={[
            { label: "Área de Membros", href: "/members" },
            { label: lesson.title },
          ]}
        />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="members-fade-in min-w-0" style={{ "--delay": "80ms" } as React.CSSProperties}>
          <VideoPlayer youtubeId={lesson.youtubeId} title={lesson.title} lessonId={lesson.id} />

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-bright)]">
              Aula {lesson.order} · {lesson.duration}
            </p>
            <h1 className="members-title mt-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
              {lesson.title}
            </h1>
            <p className="mt-3 max-w-3xl leading-relaxed text-[var(--text-secondary)]">
              {lesson.description}
            </p>
          </div>

          <nav aria-label="Navegação entre aulas" className="mt-8 grid grid-cols-2 gap-3">
            {prev ? (
              <AdjacentLink href={`/members/aula/${prev.id}`} label="Aula anterior" title={prev.title} direction="prev" />
            ) : (
              <span />
            )}
            {next ? (
              <AdjacentLink href={`/members/aula/${next.id}`} label="Próxima aula" title={next.title} direction="next" />
            ) : (
              <Link
                href="/members"
                className="col-start-2 flex items-center justify-end rounded-xl border border-[var(--border)] px-4 py-3 text-right text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--bg-hover)]"
              >
                Voltar para as aulas
              </Link>
            )}
          </nav>
        </div>

        <aside className="members-fade-in lg:sticky lg:top-24 lg:self-start" style={{ "--delay": "160ms" } as React.CSSProperties}>
          <LessonList lessons={getSortedLessons()} currentLessonId={lesson.id} />
        </aside>
      </div>
    </main>
  );
}

function AdjacentLink({
  href,
  label,
  title,
  direction,
}: {
  href: string;
  label: string;
  title: string;
  direction: "prev" | "next";
}) {
  const isNext = direction === "next";
  return (
    <Link
      href={href}
      className={`group flex min-w-0 items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:border-[var(--accent)] hover:bg-[var(--bg-hover)] ${
        isNext
          ? "col-start-2 flex-row-reverse border-[var(--accent)]/60 bg-[var(--accent)]/10 text-right"
          : "border-[var(--border)]"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[var(--accent-bright)] transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={isNext ? "M9 6l6 6-6 6" : "M15 18l-6-6 6-6"} />
      </svg>
      <span className="min-w-0">
        <span className="block text-xs text-[var(--text-secondary)]">{label}</span>
        <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{title}</span>
      </span>
    </Link>
  );
}
