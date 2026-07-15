export type CarinineId = "Knifey" | "Forky";

export interface CarinineProfile {
  id: CarinineId;
  label: string;
  subtitle: string;
  accent: "knifey" | "forky";
  description: string;
  /** Texto corto para la pantalla de seleccion */
  tagline: string;
}

/** Forky primero (el), Knifey segunda (ella) */
export const CARININE_ORDER: CarinineId[] = ["Forky", "Knifey"];

export const CARININES: Record<CarinineId, CarinineProfile> = {
  Forky: {
    id: "Forky",
    label: "Forky",
    subtitle: "Tu aventura fitness",
    accent: "forky",
    description: "Aqui van tus entrenamientos, tus planes y tu evolucion",
    tagline: "Tus entrenos",
  },
  Knifey: {
    id: "Knifey",
    label: "Knifey",
    subtitle: "Entrenadora psiquica",
    accent: "knifey",
    description: "Aqui van sus entrenamientos, la Fase Mewtwo y su progreso",
    tagline: "Sus entrenos",
  },
};

export function isCarinineId(value: string | null): value is CarinineId {
  return value === "Knifey" || value === "Forky";
}
