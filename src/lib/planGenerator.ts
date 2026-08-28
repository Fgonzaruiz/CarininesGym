import type { Exercise } from "../types/exercise";
import type { InjuryId } from "./injuries";
import { isExerciseUnsafe } from "./injuries";
import { muscleKeyForTarget, type MuscleKey } from "./muscleMap";
import type { Plan, PlanDay } from "../types/plan";

/** Marcador que identifica a los planes fabricados por el generador. */
export const GENERATED_MARKER = "🤖 Plan generado";

export type LevelId = "principiante" | "intermedio" | "avanzado";
export type FocusId = "general" | "upper" | "lower" | "core";
export type ClassRole = "cardio" | "tabata" | "hybrid";

export interface LevelDef {
  id: LevelId;
  label: string;
  desc: string;
}

export const LEVELS: LevelDef[] = [
  { id: "principiante", label: "Principiante", desc: "3 series · 12 reps · descanso 60s" },
  { id: "intermedio", label: "Intermedio", desc: "4 series · 10 reps · descanso 75s" },
  { id: "avanzado", label: "Avanzado", desc: "4 series · 8 reps · descanso 90s" },
];

export interface FocusDef {
  id: FocusId;
  label: string;
  desc: string;
}

export const FOCUSES: FocusDef[] = [
  { id: "general", label: "General", desc: "Cuerpo completo equilibrado" },
  { id: "upper", label: "Tren superior", desc: "Pecho, espalda, hombros y brazos" },
  { id: "lower", label: "Tren inferior", desc: "Piernas y glúteos" },
  { id: "core", label: "Core", desc: "Abdominales y lumbar" },
];

const LEVEL_PRESETS: Record<LevelId, { sets: number; reps: string; rest: number }> = {
  principiante: { sets: 3, reps: "12", rest: 60 },
  intermedio: { sets: 4, reps: "10", rest: 75 },
  avanzado: { sets: 4, reps: "8", rest: 90 },
};

export type DayRole =
  | "push"
  | "pull"
  | "legs"
  | "glutes"
  | "upper"
  | "core"
  | "fullbody"
  | ClassRole;

interface DayProfile {
  role: DayRole;
  name: string;
  muscles: MuscleKey[];
  exercisesPerDay: number;
}

const P = {
  push: { role: "push", name: "Empuje", muscles: ["chest", "deltoids", "triceps"], exercisesPerDay: 5 },
  pull: { role: "pull", name: "Tirón", muscles: ["upper-back", "biceps", "trapezius", "lower-back"], exercisesPerDay: 5 },
  legs: { role: "legs", name: "Piernas", muscles: ["quadriceps", "hamstring", "gluteal", "calves"], exercisesPerDay: 5 },
  glutes: { role: "glutes", name: "Glúteos", muscles: ["gluteal", "hamstring"], exercisesPerDay: 4 },
  upper: { role: "upper", name: "Tren superior", muscles: ["chest", "deltoids", "triceps", "upper-back", "biceps", "trapezius"], exercisesPerDay: 6 },
  core: { role: "core", name: "Core", muscles: ["abs", "lower-back"], exercisesPerDay: 5 },
  fullbody: {
    role: "fullbody",
    name: "Full body",
    // Orden de elección: intercala trenes para que un día completo toque todo
    muscles: ["quadriceps", "chest", "hamstring", "upper-back", "gluteal", "deltoids", "biceps", "triceps", "trapezius"],
    exercisesPerDay: 6,
  },
  cardio: { role: "cardio", name: "Cardio", muscles: [], exercisesPerDay: 3 },
  tabata: { role: "tabata", name: "Tabata", muscles: [], exercisesPerDay: 4 },
  hybrid: { role: "hybrid", name: "Hybrid", muscles: ["chest", "deltoids", "upper-back", "quadriceps", "gluteal", "abs"], exercisesPerDay: 4 },
} as Record<DayRole, DayProfile>;

function cycle<T>(arr: T[], n: number): T[] {
  return Array.from({ length: n }, (_, i) => arr[i % arr.length]);
}

/** Plantilla semanal de días de fuerza según el enfoque elegido. */
function strengthTemplate(focus: FocusId, days: number): DayProfile[] {
  let base: DayProfile[];
  switch (focus) {
    case "upper":
      base = [P.push, P.pull, P.upper];
      break;
    case "lower":
      base = [P.legs, P.glutes, P.legs];
      break;
    case "core":
      base = [P.core, P.fullbody, P.core];
      break;
    default:
      base = [P.push, P.pull, P.legs];
  }
  return cycle(base, days);
}

/** Clases elegidas (cardio, tabata, hybrid) según cuántas días de clase pidas. */
function classRolesFor(count: number): ClassRole[] {
  const all: ClassRole[] = ["cardio", "tabata", "hybrid"];
  return all.slice(0, Math.max(0, count));
}

/** Semana completa: días de fuerza + clases intercaladas. */
function buildWeekTemplate(
  focus: FocusId,
  strengthDays: number,
  classes: ClassRole[]
): DayProfile[] {
  const strength = strengthTemplate(focus, strengthDays);
  if (classes.length === 0) return strength;
  const out: DayProfile[] = [];
  let c = 0;
  for (let i = 0; i < strength.length; i++) {
    out.push(strength[i]);
    if (c < classes.length) {
      out.push(P[classes[c]]);
      c++;
    }
  }
  while (c < classes.length) {
    out.push(P[classes[c]]);
    c++;
  }
  return out;
}

function musclesOfExercise(ex: Exercise): Set<MuscleKey> {
  const s = new Set<MuscleKey>();
  const t = muscleKeyForTarget(ex.target);
  if (t) s.add(t);
  for (const m of ex.secondary_muscles) {
    const k = muscleKeyForTarget(m);
    if (k) s.add(k);
  }
  return s;
}

function isCardioExercise(ex: Exercise): boolean {
  return (
    ex.category === "cardio" ||
    ex.body_part === "cardio" ||
    ex.target === "cardiovascular system"
  );
}

/** Los estiramientos/yoga/movilidad no cuentan como ejercicio de entrenamiento. */
function isTrainingExercise(ex: Exercise): boolean {
  return !/stretch|mobility|warm.?up|self.?myofascial|prehab|yoga|toe touch|circles/i.test(
    ex.name
  );
}

/** Calidad de un ejercicio de fuerza: penaliza rarezas y premia equipo clásico. */
function strengthQuality(ex: Exercise, withInjuries: boolean): number {
  let s = 0;
  if (/lever|planche|flag|muscle up|hollow|pike|towel|swiss ball|stability ball/i.test(ex.name)) s -= 30;
  if (/snatch|clean|jerk/i.test(ex.name)) s -= 20;
  if (/press|row|squat|deadlift|pulldown|lunge|curl|extension|raise/i.test(ex.name)) s += 3;
  if (/against wall|wall sit|on wall/i.test(ex.name)) s -= 10;
  if (withInjuries) {
    // Con molestias: máquinas/cables (recorrido guiado) primero
    if (/machine|cable|smith|leverage machine|assisted/i.test(ex.equipment)) s += 3;
    if (ex.equipment === "body weight") s += 1;
  } else {
    // Sin molestias: peso libre clásico primero
    if (/barbell|dumbbell|kettlebell/i.test(ex.equipment)) s += 2;
    if (/machine|cable|smith|leverage machine|body weight|band/i.test(ex.equipment)) s += 1;
  }
  return s;
}

/** Calidad de un ejercicio de cardio/clase. */
function cardioQuality(ex: Exercise): number {
  let s = 0;
  if (/burpee|mountain climber|jump rope|run|sprint|high knee|skater|jumping jack|bike|elliptical|row|treadmill|stepmill|cross trainer/i.test(ex.name)) s += 10;
  if (/astride|half knee|semi squat|scissor|swing 360|jack jump/i.test(ex.name)) s -= 3;
  if (/against wall|on wall|\(equipment\)|push to run/i.test(ex.name)) s -= 5;
  if (ex.equipment === "body weight" || ex.equipment === "rope") s += 1;
  return s;
}

/** Catálogo filtrado por lesiones activas. */
function safeCatalog(catalog: Exercise[], injuries: InjuryId[]): Exercise[] {
  return injuries.length > 0
    ? catalog.filter((e) => !isExerciseUnsafe(e, injuries))
    : catalog;
}

/**
 * Elige ejercicios de un pool ordenados por calidad, sin repetir y sin usar
 * los ya usados en el plan (para que cada semana sea distinta).
 */
function pickRanked(
  pool: Exercise[],
  count: number,
  usedIds: Set<string>,
  rank: (e: Exercise) => number
): Exercise[] {
  const sorted = [...pool].sort((a, b) => {
    const r = rank(b) - rank(a);
    return r !== 0 ? r : a.name.localeCompare(b.name);
  });
  const chosen: Exercise[] = [];
  const seen = new Set<string>();
  for (const e of sorted) {
    if (chosen.length >= count) break;
    if (usedIds.has(e.id) || seen.has(e.id)) continue;
    seen.add(e.id);
    chosen.push(e);
  }
  return chosen;
}

/**
 * Día de fuerza: elige un ejercicio por músculo objetivo del día (en el orden
 * del perfil) para conseguir días clásicos tipo press/remo/sentadilla.
 */
function pickStrengthDayExercises(
  catalog: Exercise[],
  injuries: InjuryId[],
  profile: DayProfile,
  count: number,
  usedIds: Set<string>
): Exercise[] {
  const safe = safeCatalog(catalog, injuries);
  const pool = safe.filter(
    (e) => isTrainingExercise(e) && [...musclesOfExercise(e)].some((m) => profile.muscles.includes(m))
  );

  const byTarget = new Map<MuscleKey, Exercise[]>();
  for (const e of pool) {
    const t = muscleKeyForTarget(e.target);
    if (t && profile.muscles.includes(t)) {
      let arr = byTarget.get(t);
      if (!arr) {
        arr = [];
        byTarget.set(t, arr);
      }
      arr.push(e);
    }
  }
  const withInjuries = injuries.length > 0;
  for (const arr of byTarget.values()) {
    arr.sort((a, b) => {
      const r = strengthQuality(b, withInjuries) - strengthQuality(a, withInjuries);
      return r !== 0 ? r : a.name.localeCompare(b.name);
    });
  }

  const chosen: Exercise[] = [];
  const seen = new Set<string>();
  let round = 0;
  let guard = 0;
  while (chosen.length < count && guard++ < 60) {
    const muscle = profile.muscles[round % profile.muscles.length];
    const arr = byTarget.get(muscle);
    if (arr && arr.length > 0) {
      const idx = arr.findIndex((e) => !usedIds.has(e.id) && !seen.has(e.id));
      const pick =
        idx !== -1
          ? arr.splice(idx, 1)[0]
          : (() => {
              const reuse = arr.findIndex((e) => !seen.has(e.id));
              return reuse !== -1 ? arr.splice(reuse, 1)[0] : null;
            })();
      if (pick) {
        seen.add(pick.id);
        chosen.push(pick);
      }
    }
    round++;
  }
  return chosen;
}

export interface GeneratedExerciseSeed {
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
}

export interface GeneratedDaySeed {
  name: string;
  exercises: GeneratedExerciseSeed[];
}

export interface GenerateInput {
  planName: string;
  /** Días totales por semana (2-6), incluyendo clases si las hay */
  daysPerWeek: number;
  /** Cuántos de esos días son clases (cardio/tabata/hybrid), 0-2 */
  classDays: number;
  focus: FocusId;
  level: LevelId;
  injuries: InjuryId[];
}

function buildStrengthDay(
  catalog: Exercise[],
  profile: DayProfile,
  week: number,
  level: LevelId,
  injuries: InjuryId[],
  usedIds: Set<string>
): GeneratedDaySeed {
  const preset = LEVEL_PRESETS[level];
  const intense = week >= 3;
  const picked = pickStrengthDayExercises(
    catalog,
    injuries,
    profile,
    profile.exercisesPerDay,
    usedIds
  );
  for (const ex of picked) usedIds.add(ex.id);

  const exercises: GeneratedExerciseSeed[] = picked.map((ex) => {
    const sets = intense ? Math.min(preset.sets + 1, 5) : preset.sets;
    const rest = intense ? Math.max(preset.rest - 15, 30) : preset.rest;
    return {
      exercise_id: ex.id,
      sets,
      reps: preset.reps,
      rest_seconds: rest,
      notes: intense ? "Semana intensa: aprieta un poco más" : undefined,
    };
  });

  return { name: profile.name, exercises };
}

function buildCardioDay(
  catalog: Exercise[],
  injuries: InjuryId[],
  usedIds: Set<string>
): GeneratedDaySeed {
  const safe = safeCatalog(catalog, injuries);
  const picked = pickRanked(
    safe.filter(isCardioExercise),
    3,
    usedIds,
    cardioQuality
  );
  for (const ex of picked) usedIds.add(ex.id);

  const exercises: GeneratedExerciseSeed[] = picked.map((ex, i) =>
    i === 0
      ? {
          exercise_id: ex.id,
          sets: 1,
          reps: "20-30 min",
          rest_seconds: 0,
          notes: "Ritmo cómodo, sube poco a poco",
        }
      : { exercise_id: ex.id, sets: 3, reps: "15-20", rest_seconds: 30 }
  );

  return { name: "Cardio", exercises };
}

function buildTabataDay(
  catalog: Exercise[],
  injuries: InjuryId[],
  usedIds: Set<string>
): GeneratedDaySeed {
  const safe = safeCatalog(catalog, injuries);
  const picked = pickRanked(
    safe.filter(
      (e) => isCardioExercise(e) && (e.equipment === "body weight" || e.equipment === "rope")
    ),
    4,
    usedIds,
    cardioQuality
  );
  for (const ex of picked) usedIds.add(ex.id);

  const exercises: GeneratedExerciseSeed[] = picked.map((ex) => ({
    exercise_id: ex.id,
    sets: 1,
    reps: "20 seg",
    rest_seconds: 10,
    notes: "8 rondas · 20s a tope / 10s descanso",
  }));

  return { name: "Tabata", exercises };
}

function buildHybridDay(
  catalog: Exercise[],
  injuries: InjuryId[],
  usedIds: Set<string>
): GeneratedDaySeed {
  const strength = pickStrengthDayExercises(
    catalog,
    injuries,
    P.hybrid,
    2,
    usedIds
  );
  const safe = safeCatalog(catalog, injuries);
  const cardio = pickRanked(safe.filter(isCardioExercise), 2, usedIds, cardioQuality);
  for (const ex of [...strength, ...cardio]) usedIds.add(ex.id);

  const exercises: GeneratedExerciseSeed[] = [
    ...strength.map((ex) => ({
      exercise_id: ex.id,
      sets: 3,
      reps: "12",
      rest_seconds: 30,
    })),
    ...cardio.map((ex) => ({
      exercise_id: ex.id,
      sets: 1,
      reps: "20-30 seg",
      rest_seconds: 15,
      notes: "Intervalos",
    })),
  ];

  return { name: "Hybrid", exercises };
}

function buildDay(
  catalog: Exercise[],
  profile: DayProfile,
  week: number,
  level: LevelId,
  injuries: InjuryId[],
  usedIds: Set<string>
): GeneratedDaySeed {
  if (profile.role === "cardio") return buildCardioDay(catalog, injuries, usedIds);
  if (profile.role === "tabata") return buildTabataDay(catalog, injuries, usedIds);
  if (profile.role === "hybrid") return buildHybridDay(catalog, injuries, usedIds);
  return buildStrengthDay(catalog, profile, week, level, injuries, usedIds);
}

/** Fabrica el plan mensual completo (4 semanas). */
export function generatePlanSeed(
  catalog: Exercise[],
  input: GenerateInput
): { name: string; description: string; weeks: GeneratedDaySeed[][] } {
  const strengthDays = Math.max(1, input.daysPerWeek - input.classDays);
  const classes = classRolesFor(input.classDays);
  const template = buildWeekTemplate(input.focus, strengthDays, classes);
  const usedIds = new Set<string>();

  const weeks: GeneratedDaySeed[][] = [];
  for (let w = 1; w <= 4; w++) {
    weeks.push(
      template.map((profile) =>
        buildDay(catalog, profile, w, input.level, input.injuries, usedIds)
      )
    );
  }

  const focusLabel = FOCUSES.find((f) => f.id === input.focus)?.label ?? "General";
  const levelLabel = LEVELS.find((l) => l.id === input.level)?.label ?? "Intermedio";

  const description = [
    `${GENERATED_MARKER} · 4 semanas · ${input.daysPerWeek} días/semana`,
    `Enfoque ${focusLabel.toLowerCase()} · nivel ${levelLabel.toLowerCase()}`,
    input.injuries.length > 0
      ? "ejercicios filtrados por tus molestias"
      : "sin lesiones marcadas",
    "Las semanas 3-4 suben series y bajan descansos.",
  ].join(" · ");

  const name = input.planName.trim() || "Mi plan mensual";
  return { name, description, weeks };
}

/** Vista previa de la semana tipo (nombres + tipo de sesión). */
export function planWeekPreview(
  focus: FocusId,
  daysPerWeek: number,
  classDays: number
): { name: string; role: DayRole }[] {
  const strengthDays = Math.max(1, daysPerWeek - classDays);
  return buildWeekTemplate(focus, strengthDays, classRolesFor(classDays)).map((p) => ({
    name: p.name,
    role: p.role,
  }));
}

export function isGeneratedPlan(plan: { description: string | null }): boolean {
  return (plan.description ?? "").includes(GENERATED_MARKER);
}

/** Agrupa los días de un plan generado por semana (4 semanas). */
export function generatedPlanWeeks(plan: Plan): { week: number; days: PlanDay[] }[] {
  const dpw = Math.max(1, Math.round(plan.days.length / 4));
  return [1, 2, 3, 4].map((week) => ({
    week,
    days: plan.days
      .filter((d) => d.day_index >= (week - 1) * dpw && d.day_index < week * dpw)
      .sort((a, b) => a.day_index - b.day_index),
  }));
}

/** Tipo de sesión sugerido para un día del generador. */
export function roleSessionType(role: DayRole): "fuerza" | "cardio" | "tabata" | "hybrid" {
  if (role === "cardio") return "cardio";
  if (role === "tabata") return "tabata";
  if (role === "hybrid") return "hybrid";
  return "fuerza";
}
