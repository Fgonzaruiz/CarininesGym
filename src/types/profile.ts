export type CarinineId = "Knifey" | "Forky";

export interface CarinineProfile {
  id: CarinineId;
  label: string;
  accent: "knifey" | "forky";
  description: string;
}

export interface CarinineVoice {
  greetings: string[];
  hypeMessages: string[];
  finishNote: string;
  weekUnlocked: (weekTitle: string) => string;
  monthDone: string;
  progressTitle: string;
}

/** Forky primero (el), Knifey segunda (ella) */
export const CARININE_ORDER: CarinineId[] = ["Forky", "Knifey"];

export const CARININES: Record<CarinineId, CarinineProfile> = {
  Forky: {
    id: "Forky",
    label: "Forky",
    accent: "forky",
    description: "Planes, entrenos y progreso",
  },
  Knifey: {
    id: "Knifey",
    label: "Knifey",
    accent: "knifey",
    description: "Planes, entrenos y progreso · incluye Fase Mewtwo",
  },
};

export const CARININE_VOICE: Record<CarinineId, CarinineVoice> = {
  Forky: {
    greetings: [
      "Hora de entrenar, rey titan",
      "A por esas gains, campeon",
      "El gym te espera, rey",
      "Vamos, titan, otro dia de leyenda",
    ],
    hypeMessages: [
      "Entreno completado, rey titan",
      "Otro dia de leyenda, campeon",
      "Gains conseguidas, rey",
      "A seguir creciendo, titan",
    ],
    finishNote: "Registrado, rey. Sigue asi.",
    weekUnlocked: (week) => `Semana completada, titan. ${week}`,
    monthDone: "Mes completado, rey. Nuevo ciclo.",
    progressTitle: "Stats del titan",
  },
  Knifey: {
    greetings: [
      "Slay queeen, hora de brillar",
      "Giiirl, el gym te espera",
      "A darlo todo, queen",
      "Piernotas mode, lets go girl",
    ],
    hypeMessages: [
      "Slay total, queen",
      "Giiirl, eso fue iconic",
      "Entreno completado, slay",
      "Queen mode activated, bien hecho",
    ],
    finishNote: "Registrado, girl. Tu progreso cuenta.",
    weekUnlocked: (week) => `Slay week complete, queen. ${week}`,
    monthDone: "Mes slayed, girl. Nuevo ciclo.",
    progressTitle: "Stats de la queen",
  },
};

export function isCarinineId(value: string | null): value is CarinineId {
  return value === "Knifey" || value === "Forky";
}

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
