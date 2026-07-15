// Plan semilla que se crea automaticamente la primera vez que alguien entra.
// Ideado para entrenar piernas/abdomen/gemelos mientras el codo esta tocado,
// asi que evitamos ejercicios que carguen muneca/codo (nada de plancha, flexiones, curls pesados...).

export interface SeedExercise {
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
}

export interface SeedDay {
  name: string;
  exercises: SeedExercise[];
}

export const FASE_MEWTWO_PLAN = {
  name: "Fase Mewtwo",
  description:
    "Como el codo esta tocado toca evolucionar por otro lado, asi que nos centramos en hacer crecer esas piernotas nivel legendario. Cuatro dias: cinta, abdomen, gemelos y piernas en general. Poquito a poco, sin forzar el codito, pero dandolo todo abajo. Yaaaas queen, vamos a evolucionar.",
  days: [
    {
      name: "Cardio Core Queen",
      exercises: [
        {
          exercise_id: "3666",
          sets: 1,
          reps: "25-30 min",
          rest_seconds: 0,
          notes: "Ritmo comodo, sube la inclinacion poco a poco. Nada de codo, solo piernas reinas",
        },
        {
          exercise_id: "1377",
          sets: 1,
          reps: "30 seg x pierna",
          rest_seconds: 15,
          notes: "Estiramiento de cierre, para bajar del cardio como una diva",
        },
      ],
    },
    {
      name: "Abs de Diosa",
      exercises: [
        { exercise_id: "0274", sets: 3, reps: "20", rest_seconds: 45 },
        { exercise_id: "0872", sets: 3, reps: "15", rest_seconds: 45 },
        {
          exercise_id: "0620",
          sets: 3,
          reps: "15",
          rest_seconds: 45,
          notes: "Abdomen bajo, controla el movimiento reina",
        },
        { exercise_id: "2429", sets: 3, reps: "20", rest_seconds: 45 },
      ],
    },
    {
      name: "Gemelos de Cristal",
      exercises: [
        { exercise_id: "0594", sets: 4, reps: "20", rest_seconds: 45 },
        { exercise_id: "1373", sets: 3, reps: "25", rest_seconds: 30 },
        { exercise_id: "0284", sets: 3, reps: "20", rest_seconds: 30 },
        { exercise_id: "0605", sets: 3, reps: "15", rest_seconds: 45 },
      ],
    },
    {
      name: "Piernotas Imperiales",
      exercises: [
        { exercise_id: "0585", sets: 4, reps: "15", rest_seconds: 60 },
        { exercise_id: "0586", sets: 4, reps: "15", rest_seconds: 60 },
        {
          exercise_id: "0739",
          sets: 4,
          reps: "12",
          rest_seconds: 90,
          notes: "Peso comodo, sin prisa. Piernotas nivel Mewtwo",
        },
        { exercise_id: "3561", sets: 3, reps: "20", rest_seconds: 45 },
      ],
    },
  ] satisfies SeedDay[],
};
