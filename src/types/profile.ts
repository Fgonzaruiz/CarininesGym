export type CarinineId = "Knifey" | "Forky";

export interface CarinineProfile {
  id: CarinineId;
  label: string;
  subtitle: string;
  accent: "knifey" | "forky";
  description: string;
}

export const CARININES: Record<CarinineId, CarinineProfile> = {
  Knifey: {
    id: "Knifey",
    label: "Knifey",
    subtitle: "Entrenadora psiquica",
    accent: "knifey",
    description: "Fase Mewtwo, piernotas legendarias y evolucion total",
  },
  Forky: {
    id: "Forky",
    label: "Forky",
    subtitle: "Granja fitness",
    accent: "forky",
    description: "Tus planes, tu ritmo, tu granja de gains",
  },
};

export function isCarinineId(value: string | null): value is CarinineId {
  return value === "Knifey" || value === "Forky";
}
