import type { Exercise } from "../types/exercise";
import { muscleKeyForTarget } from "./muscleMap";
import { classDayKindFromName, CLASS_DAY_META } from "./classDays";

/**
 * Musculos que trabaja un dia del plan, sin entrenar nada:
 * cuenta cuantos ejercicios (principal + secundarios) tocan cada grupo.
 * Sirve para iluminar el MuscleMap en cuanto abres el dia.
 */
export function dayMuscleCounts(
  exerciseIds: string[],
  exById: Map<string, Exercise>
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of exerciseIds) {
    const ex = exById.get(id);
    if (!ex) continue;
    const t = muscleKeyForTarget(ex.target);
    if (t) counts[t] = (counts[t] ?? 0) + 1;
    for (const sec of ex.secondary_muscles ?? []) {
      const k = muscleKeyForTarget(sec);
      if (k) counts[k] = (counts[k] ?? 0) + 1;
    }
  }
  return counts;
}

/**
 * Preview de un dia: si es dia de clase (YOGA/HYBRID) usa los ejercicios
 * representativos de la clase, aunque el dia solo tenga el bloque unico.
 */
export function previewCountsForDay(
  dayName: string,
  exerciseIds: string[],
  exById: Map<string, Exercise>
): Record<string, number> {
  const kind = classDayKindFromName(dayName);
  if (kind) {
    return dayMuscleCounts(CLASS_DAY_META[kind].repExerciseIds, exById);
  }
  return dayMuscleCounts(exerciseIds, exById);
}

/** Une varios conteos (ej. todos los dias de una semana) en uno solo. */
export function mergeMuscleCounts(counts: Record<string, number>[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of counts) {
    for (const [k, v] of Object.entries(c)) out[k] = (out[k] ?? 0) + v;
  }
  return out;
}
