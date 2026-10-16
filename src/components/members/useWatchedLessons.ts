"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/** Chave no localStorage: array JSON com os ids das aulas assistidas. */
export const WATCHED_STORAGE_KEY = "vitrix_watched_lessons";

// Evento próprio para avisar a mesma aba; o "storage" nativo só dispara nas outras.
const CHANGE_EVENT = "vitrix-watched-change";

function readRaw(): string {
  try {
    return localStorage.getItem(WATCHED_STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function parse(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === WATCHED_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function markLessonWatched(lessonId: string) {
  const current = parse(readRaw());
  if (current.includes(lessonId)) return;
  try {
    localStorage.setItem(WATCHED_STORAGE_KEY, JSON.stringify([...current, lessonId]));
  } catch {
    // Modo privado ou storage bloqueado: o progresso só não fica salvo.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Ids assistidos. No servidor e na hidratação começa vazio. */
export function useWatchedLessons() {
  // O snapshot é a string crua: comparável por valor, não re-renderiza à toa.
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  const watched = useMemo(() => new Set(parse(raw)), [raw]);
  const isWatched = useCallback((id: string) => watched.has(id), [watched]);
  return { watched, isWatched };
}
