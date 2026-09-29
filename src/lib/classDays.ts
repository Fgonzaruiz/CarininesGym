import type { SessionType } from "../types/plan";

/**
 * Dias de clase GoFit (martes YOGA, miercoles HYBRID):
 * en el plan son UN SOLO bloque, sin subdivisiones.
 * Al completar la clase se registran los ejercicios representativos,
 * asi el mapa muscular se ilumina con todo lo entrenado de golpe.
 */
export type ClassDayKind = "yoga" | "hybrid";

/** Id virtual guardado en plan_exercises.exercise_id para el bloque de clase. */
export const CLASS_VIRTUAL_IDS: Record<ClassDayKind, string> = {
  yoga: "class-yoga",
  hybrid: "class-hybrid",
};

export interface ClassDayMeta {
  kind: ClassDayKind;
  /** Etiqueta grande que se ve al abrir el dia: solo "YOGA" / "HYBRID". */
  classLabel: string;
  durationLabel: string;
  minutes: number;
  sessionType: SessionType;
  description: string;
  /**
   * Ejercicios reales del catalogo que representan la clase.
   * Solo se usan por dentro: preview del mapa + registro al completar.
   * Todos verificados contra public/data/exercises.json.
   */
  repExerciseIds: string[];
}

export const CLASS_DAY_META: Record<ClassDayKind, ClassDayMeta> = {
  yoga: {
    kind: "yoga",
    classLabel: "YOGA",
    durationLabel: "60 min",
    minutes: 60,
    sessionType: "yoga",
    description:
      "Clase YOGA GoFit de 1 hora. Movilidad, respiracion y flexibilidad de cuerpo completo.",
    repExerciseIds: ["1494", "1709", "1512", "1377", "1259", "1405"],
  },
  hybrid: {
    kind: "hybrid",
    classLabel: "HYBRID",
    durationLabel: "55 min",
    minutes: 55,
    sessionType: "hybrid",
    description:
      "Clase HYBRID GoFit de 55 min. Fuerza + resistencia aerobica: levantar, empujar, cargar, saltar y correr.",
    repExerciseIds: ["3666", "1460", "3523", "2466", "0150", "0274"],
  },
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Detecta si un dia del plan es una clase (por su nombre). */
export function classDayKindFromName(name: string | undefined | null): ClassDayKind | null {
  if (!name) return null;
  const n = normalize(name);
  if (n.includes("yoga")) return "yoga";
  if (n.includes("hybrid") || n.includes("hibrid")) return "hybrid";
  return null;
}

/** Es el id virtual de un bloque de clase? */
export function isClassVirtualId(exerciseId: string): boolean {
  return exerciseId === CLASS_VIRTUAL_IDS.yoga || exerciseId === CLASS_VIRTUAL_IDS.hybrid;
}
