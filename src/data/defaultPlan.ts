// Plan semilla exclusivo de Knifey: Fase Mewtwo mejorada.
// Piernas, abdomen y gemelos sin cargar el codo.

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
    "Rutina legendaria para evolucionar esas piernotas mientras el codo descansa. Cuatro dias completos: cardio activacion, core psiquico, gemelos de cristal y piernas imperiales. Registra reps, peso y descansos en cada serie para ver tu evolucion.",
  days: [
    {
      name: "Dia 1 - Cardio y activacion",
      exercises: [
        {
          exercise_id: "3666",
          sets: 1,
          reps: "25-30 min",
          rest_seconds: 0,
          notes: "Cinta inclinada, ritmo comodo. Sube inclinacion poco a poco",
        },
        {
          exercise_id: "3561",
          sets: 3,
          reps: "15",
          rest_seconds: 45,
          notes: "Calentamiento de gluteos antes del cardio intenso",
        },
        {
          exercise_id: "0274",
          sets: 2,
          reps: "15",
          rest_seconds: 30,
          notes: "Core suave post-cardio",
        },
        {
          exercise_id: "1377",
          sets: 2,
          reps: "30 seg",
          rest_seconds: 15,
          notes: "Estiramiento de gemelos, cada pierna",
        },
      ],
    },
    {
      name: "Dia 2 - Core psiquico",
      exercises: [
        { exercise_id: "0274", sets: 4, reps: "20", rest_seconds: 45 },
        { exercise_id: "0872", sets: 4, reps: "15", rest_seconds: 45 },
        {
          exercise_id: "0620",
          sets: 3,
          reps: "12",
          rest_seconds: 50,
          notes: "Abdomen bajo, control total del movimiento",
        },
        { exercise_id: "2429", sets: 3, reps: "18", rest_seconds: 45 },
        { exercise_id: "0262", sets: 3, reps: "20", rest_seconds: 40, notes: "Cada lado" },
        {
          exercise_id: "0873",
          sets: 3,
          reps: "15",
          rest_seconds: 50,
          notes: "En polea si hay, si no sustituye por reverse crunch",
        },
      ],
    },
    {
      name: "Dia 3 - Gemelos legendarios",
      exercises: [
        { exercise_id: "0594", sets: 4, reps: "20", rest_seconds: 45 },
        { exercise_id: "1373", sets: 4, reps: "25", rest_seconds: 35 },
        { exercise_id: "0284", sets: 3, reps: "20", rest_seconds: 35 },
        { exercise_id: "0605", sets: 3, reps: "15", rest_seconds: 45 },
        {
          exercise_id: "0582",
          sets: 3,
          reps: "15",
          rest_seconds: 60,
          notes: "Bonus femoral, suave con el codo",
        },
      ],
    },
    {
      name: "Dia 4 - Piernas imperiales",
      exercises: [
        { exercise_id: "0585", sets: 4, reps: "15", rest_seconds: 60 },
        { exercise_id: "0586", sets: 4, reps: "15", rest_seconds: 60 },
        {
          exercise_id: "0739",
          sets: 4,
          reps: "12",
          rest_seconds: 90,
          notes: "Prensa 45, peso comodo. Piernotas nivel Mewtwo",
        },
        { exercise_id: "3561", sets: 4, reps: "20", rest_seconds: 45 },
        {
          exercise_id: "3523",
          sets: 3,
          reps: "15",
          rest_seconds: 50,
          notes: "Glute bridge en banco, aprieta arriba 2 seg",
        },
        {
          exercise_id: "1489",
          sets: 3,
          reps: "12",
          rest_seconds: 60,
          notes: "Sissy squat controlado, apoya las manos solo si hace falta",
        },
      ],
    },
  ] satisfies SeedDay[],
};
