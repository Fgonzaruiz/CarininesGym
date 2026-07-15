import type { Exercise } from "../types/exercise";

let cache: Exercise[] | null = null;
let loadingPromise: Promise<Exercise[]> | null = null;

export function getExercisesUrl(): string {
  return `${import.meta.env.BASE_URL}data/exercises.json`;
}

export async function loadExercises(): Promise<Exercise[]> {
  if (cache) return cache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = fetch(getExercisesUrl())
    .then((res) => {
      if (!res.ok) throw new Error("No se pudo cargar el catalogo de ejercicios");
      return res.json() as Promise<Exercise[]>;
    })
    .then((data) => {
      cache = data;
      return data;
    });

  return loadingPromise;
}

export function getExerciseById(
  exercises: Exercise[],
  id: string
): Exercise | undefined {
  return exercises.find((e) => e.id === id);
}

export const BODY_PARTS = [
  "back",
  "cardio",
  "chest",
  "lower arms",
  "lower legs",
  "neck",
  "shoulders",
  "upper arms",
  "upper legs",
  "waist",
] as const;

export const BODY_PART_LABELS_ES: Record<string, string> = {
  back: "Espalda",
  cardio: "Cardio",
  chest: "Pecho",
  "lower arms": "Antebrazos",
  "lower legs": "Gemelos",
  neck: "Cuello",
  shoulders: "Hombros",
  "upper arms": "Brazos",
  "upper legs": "Piernas",
  waist: "Abdomen",
};

export function bodyPartLabel(bodyPart: string): string {
  return BODY_PART_LABELS_ES[bodyPart] ?? bodyPart;
}

export function searchExercises(
  exercises: Exercise[],
  query: string,
  filters: { bodyPart?: string; equipment?: string; target?: string } = {}
): Exercise[] {
  const q = query.trim().toLowerCase();
  return exercises.filter((ex) => {
    if (filters.bodyPart && ex.body_part !== filters.bodyPart) return false;
    if (filters.equipment && ex.equipment !== filters.equipment) return false;
    if (filters.target && ex.target !== filters.target) return false;
    if (!q) return true;
    return (
      ex.name.toLowerCase().includes(q) ||
      ex.target.toLowerCase().includes(q) ||
      ex.muscle_group.toLowerCase().includes(q) ||
      ex.body_part.toLowerCase().includes(q)
    );
  });
}

/** Sugerencias de ejercicios "gemelos" para sustituir uno que moleste (mismo target, luego mismo body_part). */
export function findSimilarExercises(
  exercises: Exercise[],
  exercise: Exercise,
  limit = 12
): Exercise[] {
  const sameTarget = exercises.filter(
    (e) => e.id !== exercise.id && e.target === exercise.target
  );
  const sameBodyPart = exercises.filter(
    (e) =>
      e.id !== exercise.id &&
      e.target !== exercise.target &&
      e.body_part === exercise.body_part
  );
  return [...sameTarget, ...sameBodyPart].slice(0, limit);
}

export interface LastExerciseLog {
  weight_kg: number | null;
  reps_done: number | null;
}

/** Cardio o tiempo: no pide peso en kg. */
export function exerciseUsesWeight(reps: string, equipment: string): boolean {
  if (/min|seg|sec/i.test(reps)) return false;
  if (equipment === "body weight") return false;
  return true;
}

/** Primer numero del objetivo del plan (ej. "12" de "12-15"). */
export function parseTargetReps(reps: string): string | null {
  const match = reps.match(/^(\d+)/);
  return match ? match[1] : null;
}
