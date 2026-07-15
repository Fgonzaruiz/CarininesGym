// Plan semilla exclusivo de Knifey: Fase Mewtwo — mes de evolucion (4 semanas).
// Piernas, abdomen y gemelos sin cargar el codo. Cada semana cambia pero mantiene el enfoque.

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

export interface SeedWeek {
  week: number;
  title: string;
  subtitle: string;
  days: SeedDay[];
}

export const MEWTWO_WEEKS = 4;
export const MEWTWO_DAYS_PER_WEEK = 4;

export const FASE_MEWTWO_PLAN = {
  name: "Fase Mewtwo",
  description:
    "Plan de 4 semanas que va subiendo de nivel mientras el codo descansa. Cada semana trae rutinas distintas enfocadas en piernas, abdomen, gemelos y cardio. Completa los 4 dias de la semana para desbloquear la siguiente.",
  weeks: [
    {
      week: 1,
      title: "Semana 1 - Adaptacion",
      subtitle: "Aprende los movimientos y activa piernas y core con volumen suave",
      days: [
        {
          name: "Cardio y activacion",
          exercises: [
            {
              exercise_id: "3666",
              sets: 1,
              reps: "20-25 min",
              rest_seconds: 0,
              notes: "Cinta inclinada, ritmo comodo. Sube inclinacion poco a poco",
            },
            { exercise_id: "3561", sets: 3, reps: "12", rest_seconds: 45, notes: "Calentamiento de gluteos" },
            { exercise_id: "0274", sets: 2, reps: "15", rest_seconds: 30, notes: "Core suave post-cardio" },
            { exercise_id: "1377", sets: 2, reps: "30 seg", rest_seconds: 15, notes: "Estiramiento gemelos, cada pierna" },
          ],
        },
        {
          name: "Core basico",
          exercises: [
            { exercise_id: "0274", sets: 3, reps: "15", rest_seconds: 45 },
            { exercise_id: "0872", sets: 3, reps: "12", rest_seconds: 45 },
            { exercise_id: "0620", sets: 3, reps: "10", rest_seconds: 50, notes: "Abdomen bajo, control total" },
            { exercise_id: "2429", sets: 3, reps: "15", rest_seconds: 45 },
            { exercise_id: "0262", sets: 2, reps: "15", rest_seconds: 40, notes: "Cada lado" },
          ],
        },
        {
          name: "Gemelos intro",
          exercises: [
            { exercise_id: "0594", sets: 3, reps: "15", rest_seconds: 45 },
            { exercise_id: "1373", sets: 3, reps: "20", rest_seconds: 35 },
            { exercise_id: "0284", sets: 2, reps: "15", rest_seconds: 40 },
            { exercise_id: "0605", sets: 3, reps: "12", rest_seconds: 45 },
          ],
        },
        {
          name: "Piernas base",
          exercises: [
            { exercise_id: "0585", sets: 3, reps: "12", rest_seconds: 60 },
            { exercise_id: "0586", sets: 3, reps: "12", rest_seconds: 60 },
            {
              exercise_id: "0739",
              sets: 3,
              reps: "12",
              rest_seconds: 90,
              notes: "Prensa 45, peso comodo. Piernotas nivel 1",
            },
            { exercise_id: "3523", sets: 3, reps: "12", rest_seconds: 50, notes: "Glute bridge en banco" },
          ],
        },
      ],
    },
    {
      week: 2,
      title: "Semana 2 - Subiendo nivel",
      subtitle: "Mas volumen y variaciones nuevas para seguir progresando",
      days: [
        {
          name: "Cardio + piernas ligeras",
          exercises: [
            { exercise_id: "3666", sets: 1, reps: "25-28 min", rest_seconds: 0, notes: "Inclinacion media, ritmo constante" },
            { exercise_id: "1460", sets: 3, reps: "12", rest_seconds: 50, notes: "Walking lunge, cada pierna" },
            { exercise_id: "3561", sets: 3, reps: "15", rest_seconds: 45 },
            { exercise_id: "1377", sets: 2, reps: "35 seg", rest_seconds: 15 },
          ],
        },
        {
          name: "Core variado",
          exercises: [
            { exercise_id: "0872", sets: 4, reps: "15", rest_seconds: 45 },
            { exercise_id: "0459", sets: 3, reps: "20", rest_seconds: 40, notes: "Flutter kicks, espalda pegada al suelo" },
            { exercise_id: "0620", sets: 3, reps: "12", rest_seconds: 50 },
            { exercise_id: "0873", sets: 3, reps: "12", rest_seconds: 50, notes: "Reverse crunch en polea o suelo" },
            { exercise_id: "3544", sets: 3, reps: "25 seg", rest_seconds: 30, notes: "Side plank, cada lado" },
          ],
        },
        {
          name: "Gemelos + femoral",
          exercises: [
            { exercise_id: "0594", sets: 4, reps: "18", rest_seconds: 45 },
            { exercise_id: "1373", sets: 4, reps: "22", rest_seconds: 35 },
            { exercise_id: "0605", sets: 3, reps: "15", rest_seconds: 45 },
            { exercise_id: "0582", sets: 3, reps: "12", rest_seconds: 60, notes: "Femoral suave, sin forzar codo" },
            { exercise_id: "0284", sets: 3, reps: "18", rest_seconds: 35 },
          ],
        },
        {
          name: "Piernas progresivas",
          exercises: [
            { exercise_id: "0585", sets: 4, reps: "14", rest_seconds: 60 },
            { exercise_id: "0586", sets: 4, reps: "14", rest_seconds: 60 },
            { exercise_id: "0739", sets: 4, reps: "12", rest_seconds: 90, notes: "Sube un poco el peso respecto a semana 1" },
            { exercise_id: "1008", sets: 3, reps: "10", rest_seconds: 55, notes: "Step-up con banda, cada pierna" },
            { exercise_id: "3523", sets: 3, reps: "15", rest_seconds: 50, notes: "Aprieta arriba 2 seg" },
          ],
        },
      ],
    },
    {
      week: 3,
      title: "Semana 3 - Intensidad",
      subtitle: "Mas series, menos descanso y ejercicios mas exigentes",
      days: [
        {
          name: "Cardio intenso",
          exercises: [
            { exercise_id: "3666", sets: 1, reps: "28-30 min", rest_seconds: 0, notes: "Inclinacion alta, ultimos 5 min fuertes" },
            {
              exercise_id: "2466",
              sets: 3,
              reps: "20",
              rest_seconds: 40,
              notes: "Mountain climber lento y controlado",
            },
            { exercise_id: "3561", sets: 4, reps: "15", rest_seconds: 40 },
            { exercise_id: "0274", sets: 2, reps: "20", rest_seconds: 30, notes: "Finisher de core" },
          ],
        },
        {
          name: "Core intenso",
          exercises: [
            { exercise_id: "0274", sets: 4, reps: "20", rest_seconds: 40 },
            { exercise_id: "0972", sets: 3, reps: "20", rest_seconds: 45, notes: "Bicycle crunch con banda" },
            { exercise_id: "0620", sets: 4, reps: "12", rest_seconds: 45 },
            { exercise_id: "2429", sets: 3, reps: "18", rest_seconds: 40 },
            { exercise_id: "0873", sets: 3, reps: "15", rest_seconds: 45 },
          ],
        },
        {
          name: "Gemelos pico",
          exercises: [
            { exercise_id: "0594", sets: 5, reps: "18", rest_seconds: 40 },
            { exercise_id: "1373", sets: 4, reps: "25", rest_seconds: 30 },
            { exercise_id: "0284", sets: 4, reps: "18", rest_seconds: 35 },
            { exercise_id: "0605", sets: 4, reps: "15", rest_seconds: 40 },
            { exercise_id: "0582", sets: 3, reps: "14", rest_seconds: 55 },
          ],
        },
        {
          name: "Piernas fuertes",
          exercises: [
            { exercise_id: "0585", sets: 4, reps: "15", rest_seconds: 55 },
            { exercise_id: "0586", sets: 4, reps: "15", rest_seconds: 55 },
            {
              exercise_id: "0739",
              sets: 4,
              reps: "10",
              rest_seconds: 90,
              notes: "Mas peso, rango completo sin bloquear rodillas",
            },
            { exercise_id: "1489", sets: 3, reps: "10", rest_seconds: 60, notes: "Sissy squat controlado" },
            { exercise_id: "3236", sets: 3, reps: "15", rest_seconds: 50, notes: "Hip thrust con banda" },
          ],
        },
      ],
    },
    {
      week: 4,
      title: "Semana 4 - Tope del mes",
      subtitle: "Pico del mes: maximo enfoque en piernas, core y gemelos",
      days: [
        {
          name: "Cardio maximo",
          exercises: [
            { exercise_id: "3666", sets: 1, reps: "30-35 min", rest_seconds: 0, notes: "Tu mejor sesion de cardio del mes" },
            { exercise_id: "1460", sets: 4, reps: "14", rest_seconds: 45, notes: "Walking lunge, paso largo" },
            { exercise_id: "3561", sets: 4, reps: "18", rest_seconds: 40 },
            { exercise_id: "1377", sets: 3, reps: "40 seg", rest_seconds: 15 },
            { exercise_id: "0274", sets: 2, reps: "25", rest_seconds: 25, notes: "Core finisher" },
          ],
        },
        {
          name: "Core maximo",
          exercises: [
            { exercise_id: "0274", sets: 4, reps: "25", rest_seconds: 35 },
            { exercise_id: "0872", sets: 4, reps: "18", rest_seconds: 40 },
            { exercise_id: "0620", sets: 4, reps: "15", rest_seconds: 45 },
            { exercise_id: "0459", sets: 3, reps: "25", rest_seconds: 35 },
            { exercise_id: "2429", sets: 4, reps: "20", rest_seconds: 40 },
            { exercise_id: "0262", sets: 3, reps: "20", rest_seconds: 35, notes: "Cada lado" },
          ],
        },
        {
          name: "Gemelos maximo",
          exercises: [
            { exercise_id: "0594", sets: 5, reps: "22", rest_seconds: 35 },
            { exercise_id: "1373", sets: 5, reps: "28", rest_seconds: 30 },
            { exercise_id: "0284", sets: 4, reps: "20", rest_seconds: 30 },
            { exercise_id: "0605", sets: 4, reps: "18", rest_seconds: 40 },
            { exercise_id: "0582", sets: 4, reps: "15", rest_seconds: 50 },
          ],
        },
        {
          name: "Piernas finales",
          exercises: [
            { exercise_id: "0585", sets: 5, reps: "15", rest_seconds: 50 },
            { exercise_id: "0586", sets: 5, reps: "15", rest_seconds: 50 },
            {
              exercise_id: "0739",
              sets: 5,
              reps: "10",
              rest_seconds: 90,
              notes: "Peso maximo comodo del mes",
            },
            { exercise_id: "1489", sets: 4, reps: "12", rest_seconds: 55 },
            { exercise_id: "3523", sets: 4, reps: "18", rest_seconds: 45 },
            { exercise_id: "1460", sets: 3, reps: "16", rest_seconds: 50, notes: "Finisher piernas" },
          ],
        },
      ],
    },
  ] satisfies SeedWeek[],
};

function flattenMewtwoDays(): SeedDay[] {
  return FASE_MEWTWO_PLAN.weeks.flatMap((week) =>
    week.days.map((day) => ({
      name: `Semana ${week.week} · ${day.name}`,
      exercises: day.exercises,
    }))
  );
}

/** 16 dias en orden para seed/upgrade en Supabase */
export const FASE_MEWTWO_FLAT_DAYS = flattenMewtwoDays();
