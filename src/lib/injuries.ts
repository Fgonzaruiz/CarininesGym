import type { Exercise } from "../types/exercise";

/**
 * Molestias/lesiones que puedes marcar en tu perfil. Cuando una zona te duele,
 * la app evita sugerirte ejercicios que la carguen y te propone alternativas
 * que trabajan el mismo músculo sin forzar esa articulación.
 */
export type InjuryId =
  | "muneca"
  | "codo"
  | "hombro"
  | "rodilla"
  | "espalda_baja"
  | "cuello";

export const INJURY_IDS: InjuryId[] = [
  "muneca",
  "codo",
  "hombro",
  "rodilla",
  "espalda_baja",
  "cuello",
];

export interface InjuryDef {
  id: InjuryId;
  label: string;
  /** Frase para la UI tipo "Me duele la muñeca" */
  question: string;
  /** Motivo mostrado cuando un ejercicio la carga */
  reason: string;
  /** Consejo corto */
  tip: string;
}

export const INJURIES: InjuryDef[] = [
  {
    id: "muneca",
    label: "Muñeca",
    question: "Me duele la muñeca",
    reason: "carga peso sobre la muñeca",
    tip: "Busca máquinas, cables o ejercicios sin agarre de peso libre.",
  },
  {
    id: "codo",
    label: "Codo",
    question: "Me duele el codo",
    reason: "tensa el codo (codo de tenista/golfista)",
    tip: "Evita curls, press y remos pesados; prueba agarres neutros o máquina.",
  },
  {
    id: "hombro",
    label: "Hombro",
    question: "Me duele el hombro",
    reason: "sobrecarga el hombro",
    tip: "Evita presses y elevaciones; las poleas y máquinas con recorrido guiado suelen ir mejor.",
  },
  {
    id: "rodilla",
    label: "Rodilla",
    question: "Me duele la rodilla",
    reason: "flexiona y carga la rodilla",
    tip: "Evita sentadillas profundas, zancadas y saltos; la bici o prensa suave van mejor.",
  },
  {
    id: "espalda_baja",
    label: "Espalda baja",
    question: "Me duele la espalda baja",
    reason: "carga la zona lumbar",
    tip: "Evita peso muerto, giros y crunches; mantén la espalda neutra siempre.",
  },
  {
    id: "cuello",
    label: "Cuello",
    question: "Me duele el cuello",
    reason: "carga o tensa el cuello",
    tip: "Evita encogimientos, la barra apoyada en el cuello y ejercicios de cuello.",
  },
];

interface InjuryRule {
  /** Solo se aplica si el equipment del ejercicio está en esta lista */
  equipment?: string[];
  /** Cualquiera de estos patrones en el nombre marca el ejercicio */
  name?: RegExp[];
  /** Target (músculo objetivo) */
  target?: string[];
  /** body_part del ejercicio */
  bodyPart?: string[];
  /** Músculos secundarios */
  secondary?: string[];
}

interface InjuryRules {
  id: InjuryId;
  reason: string;
  rules: InjuryRule[];
}

/**
 * Reglas de sentido común sobre qué ejercicios cargan cada articulación.
 * Se evaluan contra el catálogo (nombre, equipo, músculos).
 */
const RULES: InjuryRules[] = [
  {
    id: "muneca",
    reason: "carga peso sobre la muñeca",
    rules: [
      {
        name: [
          /push.?up/i,
          /plank/i,
          /planche/i,
          /handstand/i,
          /burpee/i,
          /snatch/i,
          /clean/i,
          /farmer/i,
          /carry/i,
          /wrist/i,
          /grip/i,
          /slam/i,
          /battling rope/i,
          /battle rope/i,
          /\bdip/i,
        ],
      },
      {
        equipment: [
          "barbell",
          "dumbbell",
          "ez barbell",
          "kettlebell",
          "olympic barbell",
          "trap bar",
          "hammer",
          "tire",
        ],
      },
      { target: ["forearms"] },
      { bodyPart: ["lower arms"] },
    ],
  },
  {
    id: "codo",
    reason: "tensa el codo (codo de tenista/golfista)",
    rules: [
      {
        name: [
          /curl/i,
          /press/i,
          /extension/i,
          /\bdip/i,
          /push.?up/i,
          /pull.?up/i,
          /chin.?up/i,
          /\brow/i,
          /triceps/i,
          /kickback/i,
          /skull/i,
          /snatch/i,
          /clean/i,
          /tate/i,
        ],
      },
      {
        equipment: [
          "barbell",
          "dumbbell",
          "ez barbell",
          "olympic barbell",
          "kettlebell",
          "trap bar",
          "hammer",
        ],
      },
      { target: ["triceps", "biceps", "forearms"] },
      { bodyPart: ["lower arms"] },
    ],
  },
  {
    id: "hombro",
    reason: "sobrecarga el hombro",
    rules: [
      {
        name: [
          /press/i,
          /raise/i,
          /\bfly/i,
          /\bdip/i,
          /push.?up/i,
          /handstand/i,
          /snatch/i,
          /clean/i,
          /upright.?row/i,
          /burpee/i,
          /overhead/i,
          /behind.?the.?neck/i,
          /shrug/i,
          /swing/i,
        ],
      },
      {
        equipment: [
          "barbell",
          "dumbbell",
          "olympic barbell",
          "kettlebell",
          "trap bar",
        ],
      },
      { target: ["delts"] },
      { bodyPart: ["shoulders"] },
    ],
  },
  {
    id: "rodilla",
    reason: "flexiona y carga la rodilla",
    rules: [
      {
        name: [
          /squat/i,
          /lunge/i,
          /jump/i,
          /burpee/i,
          /step.?up/i,
          /wall sit/i,
          /sprint/i,
          /jog/i,
          /running/i,
          /skater/i,
          /pistol/i,
          /split/i,
          /\bhop/i,
          /drop/i,
        ],
      },
      { target: ["quads"] },
    ],
  },
  {
    id: "espalda_baja",
    reason: "carga la zona lumbar",
    rules: [
      {
        name: [
          /deadlift/i,
          /good morning/i,
          /back extension/i,
          /hyperextension/i,
          /sit.?up/i,
          /crunch/i,
          /russian twist/i,
          /torso rotation/i,
          /swing/i,
          /snatch/i,
          /clean/i,
          /bent.?over/i,
          /turkish/i,
          /overhead squat/i,
        ],
      },
      { secondary: ["lower back"] },
    ],
  },
  {
    id: "cuello",
    reason: "carga o tensa el cuello",
    rules: [
      {
        name: [/shrug/i, /neck/i, /handstand/i, /upright.?row/i],
      },
      { bodyPart: ["neck"] },
      { target: ["levator scapulae"] },
      { equipment: ["barbell", "olympic barbell"], name: [/squat/i] },
    ],
  },
];

function ruleMatches(ex: Exercise, rule: InjuryRule): boolean {
  if (rule.equipment && !rule.equipment.includes(ex.equipment)) return false;
  if (rule.name && !rule.name.some((re) => re.test(ex.name))) return false;
  if (rule.target && !rule.target.includes(ex.target)) return false;
  if (rule.bodyPart && !rule.bodyPart.includes(ex.body_part)) return false;
  if (
    rule.secondary &&
    !rule.secondary.some((m) => ex.secondary_muscles.includes(m))
  ) {
    return false;
  }
  return true;
}

export function getInjury(id: InjuryId): InjuryDef {
  return INJURIES.find((i) => i.id === id)!;
}

export function injuryLabel(id: InjuryId): string {
  return getInjury(id).label;
}

/** Devuelve los motivos por los que un ejercicio es inseguro para las lesiones activas. */
export function unsafeReasonsFor(
  ex: Exercise,
  injuries: InjuryId[]
): string[] {
  if (injuries.length === 0) return [];
  const reasons: string[] = [];
  for (const def of RULES) {
    if (!injuries.includes(def.id)) continue;
    if (def.rules.some((rule) => ruleMatches(ex, rule))) {
      reasons.push(def.reason);
    }
  }
  return reasons;
}

export function isExerciseUnsafe(ex: Exercise, injuries: InjuryId[]): boolean {
  return unsafeReasonsFor(ex, injuries).length > 0;
}

/** Filtra un catálogo dejando solo ejercicios seguros para las lesiones activas. */
export function filterSafeExercises(
  exercises: Exercise[],
  injuries: InjuryId[]
): Exercise[] {
  if (injuries.length === 0) return exercises;
  return exercises.filter((ex) => !isExerciseUnsafe(ex, injuries));
}

/** Equipos "amables" con las articulaciones: se priorizan como alternativas. */
const JOINT_FRIENDLY_EQUIPMENT = new Set([
  "machine",
  "leverage machine",
  "assisted",
  "cable",
  "resistance band",
  "stationary bike",
  "elliptical machine",
  "skierg machine",
  "stability ball",
  "bosu ball",
]);

function jointFriendliness(ex: Exercise): number {
  let score = 0;
  if (JOINT_FRIENDLY_EQUIPMENT.has(ex.equipment)) score = 2;
  else if (ex.equipment === "body weight") score = 1;
  // Los estiramientos/movilidad no son un sustituto de entrenamiento
  if (/stretch|mobility/i.test(ex.name)) score -= 1;
  return Math.max(score, 0);
}

/**
 * Alternativas seguras para sustituir un ejercicio cuando algo te duele:
 * mismo músculo objetivo (o misma zona) que NO cargue tus lesiones activas,
 * priorizando equipos amables con las articulaciones.
 */
export function findSafeAlternatives(
  exercises: Exercise[],
  current: Exercise,
  injuries: InjuryId[],
  limit = 10
): Exercise[] {
  const safePool = injuries.length
    ? exercises.filter(
        (e) => e.id !== current.id && !isExerciseUnsafe(e, injuries)
      )
    : exercises.filter((e) => e.id !== current.id);

  const sameTarget = safePool.filter((e) => e.target === current.target);
  const sameBodyPart = safePool.filter(
    (e) => e.target !== current.target && e.body_part === current.body_part
  );

  const ranked = [...sameTarget, ...sameBodyPart]
    .map((e) => ({ e, score: jointFriendliness(e) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.e);

  return ranked.slice(0, limit);
}

/** Etiqueta corta de los equipos que una lesión te obliga a evitar (para la UI). */
export function unsafeEquipmentHint(injuries: InjuryId[]): string {
  if (injuries.length === 0) return "";
  return injuries.map((id) => getInjury(id).label).join(" y ");
}
