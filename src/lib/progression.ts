// Helpers puros de doble progresión + PRs. Sin Supabase para poder testear fácil.

export interface RepRange {
  min: number;
  max: number;
}

/** "8-12" -> {min:8,max:12}. "12-15 por lado" -> {12,15}. "30-35 min" -> null (tiempo). */
export function parseRepRange(reps: string): RepRange | null {
  if (/min|seg|sec/i.test(reps)) return null;
  const m = reps.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) {
    const min = Number(m[1]);
    const max = Number(m[2]);
    if (max >= min && max < 200) return { min, max };
    return null;
  }
  const single = reps.match(/^(\d+)/);
  if (single) {
    const v = Number(single[1]);
    return { min: v, max: v };
  }
  return null;
}

export function incrementFor(weight: number, bodyPart?: string, rangeMax?: number): number {
  const isLeg = bodyPart === "upper legs" || bodyPart === "lower legs";
  if (isLeg && weight >= 30) return 5;
  if (weight >= 60) return 5;
  if (rangeMax != null && rangeMax >= 15 && weight < 20) return 1.25;
  return 2.5;
}

export interface Suggestion {
  weight: number | null;
  repsTarget: string;
  shouldJump: boolean;
  nextWeight: number | null;
  label: string;
}

/**
 * Doble progresión: si tu última mejor marca ya clava el tope, toca subir peso.
 * Si no, mismo peso buscando +1 rep.
 */
export function suggestNext(
  lastWeight: number | null,
  lastReps: number | null,
  reps: string,
  bodyPart?: string
): Suggestion {
  const range = parseRepRange(reps);
  if (lastWeight == null || lastWeight <= 0) {
    if (range) {
      return {
        weight: null,
        repsTarget: `${range.min}-${range.max}`,
        shouldJump: false,
        nextWeight: null,
        label: "Peso corporal o empieza ligero y apunta todo",
      };
    }
    return {
      weight: null,
      repsTarget: reps,
      shouldJump: false,
      nextWeight: null,
      label: "Apunta reps y peso",
    };
  }
  if (!range) {
    return {
      weight: lastWeight,
      repsTarget: reps,
      shouldJump: false,
      nextWeight: null,
      label: `Repite ${lastWeight} kg`,
    };
  }
  const repsDone = lastReps ?? range.min;
  if (repsDone >= range.max) {
    const inc = incrementFor(lastWeight, bodyPart, range.max);
    const next = Math.round((lastWeight + inc) * 100) / 100;
    return {
      weight: lastWeight,
      repsTarget: `${range.min}-${range.max}`,
      shouldJump: true,
      nextWeight: next,
      label: `Clavado ${lastWeight}x${repsDone}: prueba ${next} kg x${range.min}`,
    };
  }
  const target = Math.min(repsDone + 1, range.max);
  return {
    weight: lastWeight,
    repsTarget: `${target}-${range.max}`,
    shouldJump: false,
    nextWeight: null,
    label: `Repite ${lastWeight} kg a por ${target}-${range.max} reps`,
  };
}

/** 1RM estimado (Epley). */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export interface RecentPoint {
  date: string;
  maxWeight: number;
  maxReps: number;
  sets: number;
}

/** 3+ sesiones con mismo peso máximo y sin subir reps = estancado. */
export function isStalled(recent: RecentPoint[]): boolean {
  if (recent.length < 3) return false;
  const last3 = recent.slice(-3);
  const w0 = last3[0].maxWeight;
  if (w0 <= 0) return false;
  if (!last3.every((p) => p.maxWeight === w0)) return false;
  return last3[2].maxReps <= last3[0].maxReps;
}

export interface PR {
  exercise_id: string;
  exercise_name: string;
  kind: "peso" | "reps" | "volumen";
  detail: string;
}
