import type { SessionType } from "../types/plan";

export interface SessionTypeInfo {
  label: string;
  shortLabel: string;
  description: string;
  chipClass: string;
  /** Clases del círculo/icono en tarjetas */
  iconClass: string;
  defaultDurationMinutes: number;
}

export const SESSION_TYPE_INFO: Record<SessionType, SessionTypeInfo> = {
  fuerza: {
    label: "Fuerza",
    shortLabel: "Fuerza",
    description: "Tu plan de toda la vida: series, reps y peso.",
    chipClass: "bg-meadow-100 text-meadow-700",
    iconClass: "bg-gradient-to-br from-meadow-400 to-meadow-600",
    defaultDurationMinutes: 60,
  },
  tabata: {
    label: "Tabata",
    shortLabel: "Tabata",
    description: "Rondas explosivas: 20s a tope + 10s de descanso.",
    chipClass: "bg-pinky-100 text-pinky-600",
    iconClass: "bg-gradient-to-br from-pinky-400 to-pinky-600",
    defaultDurationMinutes: 20,
  },
  hybrid: {
    label: "Hybrid",
    shortLabel: "Hybrid",
    description: "Fuerza + cardio o tabata en el mismo entreno.",
    chipClass: "bg-psychic-100 text-psychic-700",
    iconClass: "bg-gradient-to-br from-psychic-400 to-psychic-700",
    defaultDurationMinutes: 45,
  },
  cardio: {
    label: "Cardio",
    shortLabel: "Cardio",
    description: "Correr, bici, cuerda, elíptica... a mover el corazón.",
    chipClass: "bg-sky-glow-100 text-sky-glow-600",
    iconClass: "bg-gradient-to-br from-sky-glow-400 to-sky-glow-600",
    defaultDurationMinutes: 30,
  },
};

/** Detecta el tipo de sesión por el nombre del día ("Tabata", "Cardio", "Hybrid"...). */
export function sessionTypeFromDayName(name: string | undefined | null): SessionType | null {
  if (!name) return null;
  const n = name.toLowerCase();
  for (const t of Object.keys(SESSION_TYPE_INFO) as SessionType[]) {
    if (n.includes(t)) return t;
  }
  return null;
}

export function formatDuration(minutes: number | null): string | null {
  if (minutes == null || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}
