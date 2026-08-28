/**
 * Grupos musculares que se pintan en el mapa corporal (frente y espalda).
 *
 * Los slugs y la agrupación siguen el mapa corporal de OpenGym
 * (https://github.com/alexpcosta/opengym): 18 músculos que la geometría SVG
 * puede dibujar de verdad. Cada grupo agrupa los nombres que usa el dataset de
 * ejercicios (tanto "target" como "secondary_muscles"), que es exactamente el
 * vocabulario que mapea OpenGym (19 primarios + 40 secundarios colapsados aquí).
 */
export type MuscleKey =
  | "trapezius"
  | "deltoids"
  | "chest"
  | "upper-back"
  | "serratus"
  | "biceps"
  | "triceps"
  | "forearm"
  | "abs"
  | "obliques"
  | "lower-back"
  | "gluteal"
  | "quadriceps"
  | "hamstring"
  | "adductors"
  | "hip-flexors"
  | "calves"
  | "tibialis";

/** Orden de cabeza a pies: también el orden de cualquier lista derivada. */
export const MUSCLE_KEYS: MuscleKey[] = [
  "trapezius",
  "deltoids",
  "chest",
  "upper-back",
  "serratus",
  "biceps",
  "triceps",
  "forearm",
  "abs",
  "obliques",
  "lower-back",
  "gluteal",
  "quadriceps",
  "hamstring",
  "adductors",
  "hip-flexors",
  "calves",
  "tibialis",
];

export const MUSCLE_LABELS: Record<MuscleKey, string> = {
  trapezius: "Trapecios",
  deltoids: "Hombros",
  chest: "Pecho",
  "upper-back": "Dorsales",
  serratus: "Serrato",
  biceps: "Bíceps",
  triceps: "Tríceps",
  forearm: "Antebrazos",
  abs: "Abdominales",
  obliques: "Oblicuos",
  "lower-back": "Lumbar",
  gluteal: "Glúteos",
  quadriceps: "Cuádriceps",
  hamstring: "Femorales",
  adductors: "Aductores",
  "hip-flexors": "Flexores de cadera",
  calves: "Gemelos",
  tibialis: "Tibial anterior",
};

/** Sinónimos que usa el dataset para cada grupo (vocabulario de OpenGym). */
const SYNONYMS: Record<MuscleKey, string[]> = {
  trapezius: ["traps", "trapezius", "levator scapulae"],
  deltoids: ["delts", "deltoids", "shoulders", "rear deltoids", "rotator cuff"],
  chest: ["chest", "pectorals", "upper chest"],
  "upper-back": ["upper back", "lats", "latissimus dorsi", "back", "rhomboids"],
  serratus: ["serratus anterior"],
  biceps: ["biceps", "brachialis"],
  triceps: ["triceps"],
  forearm: ["forearms", "forearm", "wrists", "wrist flexors", "wrist extensors", "grip muscles"],
  abs: ["abs", "abdominals", "lower abs", "core"],
  obliques: ["obliques"],
  "lower-back": ["spine", "lower back"],
  gluteal: ["glutes", "abductors"],
  quadriceps: ["quads", "quadriceps"],
  hamstring: ["hamstrings"],
  adductors: ["adductors", "groin", "inner thighs"],
  "hip-flexors": ["hip flexors"],
  calves: ["calves", "soleus"],
  tibialis: ["shins", "tibialis"],
};

const SYNONYM_LOOKUP = new Map<string, MuscleKey>();
for (const key of MUSCLE_KEYS) {
  for (const name of SYNONYMS[key]) SYNONYM_LOOKUP.set(name, key);
}

/** Devuelve el grupo muscular de un nombre del dataset (target o secundario). */
export function muscleKeyForTarget(name: string): MuscleKey | null {
  return SYNONYM_LOOKUP.get(name.trim().toLowerCase()) ?? null;
}

/** Color de un músculo según cuántas sesiones lo han trabajado en el periodo. */
export function muscleColor(count: number): string {
  if (count <= 0) return "#f6e3cf"; // color piel: no entrenado
  if (count === 1) return "#c8e6c9";
  if (count === 2) return "#81c784";
  if (count === 3) return "#4caf50";
  return "#1b5e20";
}
