// Plan semilla exclusivo de Knifey: Fase Mewtwo.
// UNA SOLA SEMANA de 5 dias que se repite (como la rutina de Forky):
// Lunes Pierna, Martes YOGA (clase GoFit 60 min),
// Miercoles HYBRID (clase GoFit 55 min, fuerza + cardio funcional),
// Jueves Core + Gemelos, Viernes Tren superior asistido (dominadas con goma).
// El codo se cuida: solo el viernes toca tiron, siempre asistido y sin dolor.
// Progresion por doble progresion: cuando clavas el tope del rango en todas
// las series con buena tecnica, sube peso (tren sup +2.5kg, pierna +5kg)
// o usa una goma mas fina en dominadas.

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

export const KNIFEY_DAYS_PER_WEEK = 5;

export const FASE_MEWTWO_PLAN = {
  name: "Fase Mewtwo",
  description:
    "Tu semana de 5 dias que se repite: lunes pierna, martes YOGA (GoFit 60 min), miercoles HYBRID (GoFit 55 min), jueves core + gemelos y viernes tren superior con dominadas asistidas. Los dias de clase son un bloque unico y al completarlos se registra todo lo entrenado. Codo con mimo: el tiron es siempre asistido.",
  days: [
    {
      name: "Lunes · Pierna",
      exercises: [
        {
          exercise_id: "0585",
          sets: 4,
          reps: "12-15",
          rest_seconds: 60,
          notes: "Extension de cuadriceps. A 4x15 sube +5kg. Apunta placas",
        },
        {
          exercise_id: "0586",
          sets: 4,
          reps: "12-15",
          rest_seconds: 60,
          notes: "Femoral tumbado. A 4x15 sube +5kg",
        },
        {
          exercise_id: "0739",
          sets: 4,
          reps: "10-12",
          rest_seconds: 90,
          notes: "Prensa 45, rango completo sin bloquear rodillas",
        },
        {
          exercise_id: "1460",
          sets: 3,
          reps: "12",
          rest_seconds: 60,
          notes: "Zancadas andando, paso largo, cada pierna",
        },
        {
          exercise_id: "3523",
          sets: 3,
          reps: "15",
          rest_seconds: 50,
          notes: "Puente de gluteo en banco, aprieta 2 seg arriba",
        },
      ],
    },
    {
      name: "Martes · YOGA (clase GoFit 60 min)",
      exercises: [
        {
          exercise_id: "class-yoga",
          sets: 1,
          reps: "60 min",
          rest_seconds: 0,
          notes: "Ve a la clase YOGA de GoFit y al terminar marca la clase como completada.",
        },
      ],
    },
    {
      name: "Miercoles · HYBRID (clase GoFit 55 min)",
      exercises: [
        {
          exercise_id: "class-hybrid",
          sets: 1,
          reps: "55 min",
          rest_seconds: 0,
          notes: "Ve a la clase HYBRID de GoFit y al terminar marca la clase como completada.",
        },
      ],
    },
    {
      name: "Jueves · Core + Gemelos",
      exercises: [
        { exercise_id: "0274", sets: 3, reps: "15-20", rest_seconds: 40 },
        {
          exercise_id: "0872",
          sets: 3,
          reps: "12-15",
          rest_seconds: 45,
          notes: "Reverse crunch controlado",
        },
        {
          exercise_id: "0620",
          sets: 3,
          reps: "10-15",
          rest_seconds: 50,
          notes: "Abdomen bajo, lumbar pegada",
        },
        {
          exercise_id: "0594",
          sets: 4,
          reps: "15-20",
          rest_seconds: 45,
          notes: "Gemelo sentado. A 4x20 sube +5kg",
        },
        {
          exercise_id: "1373",
          sets: 4,
          reps: "20-25",
          rest_seconds: 35,
          notes: "Gemelo de pie, pausa 1 seg arriba",
        },
        {
          exercise_id: "0605",
          sets: 3,
          reps: "12-15",
          rest_seconds: 45,
          notes: "Soleo / tibial, suave",
        },
      ],
    },
    {
      name: "Viernes · Tren superior asistido (dominadas)",
      exercises: [
        {
          exercise_id: "0970",
          sets: 4,
          reps: "6-10",
          rest_seconds: 120,
          notes:
            "Dominada con goma. Empieza con goma GRUESA; cuando claves 4x10 pasa a goma mas fina. CERO dolor de codo: si duele, para",
        },
        {
          exercise_id: "0150",
          sets: 3,
          reps: "10-15",
          rest_seconds: 90,
          notes: "Jalon al pecho ligero para sumar volumen de dorsal sin freir el codo",
        },
        {
          exercise_id: "0180",
          sets: 3,
          reps: "10-15",
          rest_seconds: 75,
          notes: "Remo sentado agarre neutro, aprieta 1 seg. Codo pegado, sin dolor",
        },
        {
          exercise_id: "0334",
          sets: 3,
          reps: "12-20",
          rest_seconds: 60,
          notes: "Laterales ligeros y estrictos, hombro sano",
        },
        {
          exercise_id: "0203",
          sets: 2,
          reps: "15-20",
          rest_seconds: 60,
          notes: "Face pulls ligero 12.5-15kg, postura y hombro posterior",
        },
        {
          exercise_id: "0872",
          sets: 2,
          reps: "12",
          rest_seconds: 45,
          notes: "Core suave para cerrar, sin colgarse",
        },
      ],
    },
  ] satisfies SeedDay[],
};

/** 5 dias en orden para seed/migracion en Supabase. La semana se repite. */
export const FASE_MEWTWO_FLAT_DAYS: SeedDay[] = FASE_MEWTWO_PLAN.days;
