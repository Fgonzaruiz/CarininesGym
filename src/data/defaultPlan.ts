// Plan semilla exclusivo de Knifey: Fase Mewtwo — mes de evolucion (4 semanas).
// 5 dias por semana: Lunes Pierna, Martes YOGA (clase GoFit 60 min),
// Miercoles HYBRID (clase GoFit 55 min, fuerza + cardio funcional),
// Jueves Core + Gemelos, Viernes Tren superior asistido (dominadas con goma).
// El codo se cuida: solo el viernes toca tiron, siempre asistido y sin dolor.

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
export const MEWTWO_DAYS_PER_WEEK = 5;

/**
 * La clase de Yoga es UN SOLO bloque: al abrir el dia solo se ve "YOGA"
 * y al completarlo se registra todo lo entrenado de golpe (ver lib/classDays).
 */
function yogaDay(): SeedExercise[] {
  return [
    {
      exercise_id: "class-yoga",
      sets: 1,
      reps: "60 min",
      rest_seconds: 0,
      notes: "Ve a la clase YOGA de GoFit y al terminar marca la clase como completada.",
    },
  ];
}

/** La clase HYBRID es UN SOLO bloque, igual que Yoga. */
function hybridDay(): SeedExercise[] {
  return [
    {
      exercise_id: "class-hybrid",
      sets: 1,
      reps: "55 min",
      rest_seconds: 0,
      notes: "Ve a la clase HYBRID de GoFit y al terminar marca la clase como completada.",
    },
  ];
}

/** Tren superior con dominadas asistidas: progresa de goma gruesa a menos ayuda. */
function upperDay(
  pullSets: number,
  pullReps: string,
  pullNote: string,
  rowReps = "10-15",
  lateralReps = "12-20"
): SeedExercise[] {
  return [
    {
      exercise_id: "0970",
      sets: pullSets,
      reps: pullReps,
      rest_seconds: 120,
      notes: pullNote,
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
      reps: rowReps,
      rest_seconds: 75,
      notes: "Remo sentado agarre neutro, aprieta 1 seg. Codo pegado, sin dolor",
    },
    {
      exercise_id: "0334",
      sets: 3,
      reps: lateralReps,
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
  ];
}

export const FASE_MEWTWO_PLAN = {
  name: "Fase Mewtwo",
  description:
    "Plan de 4 semanas y 5 dias por semana: lunes pierna, martes YOGA (GoFit 60 min), miercoles HYBRID (GoFit 55 min), jueves core + gemelos y viernes tren superior con dominadas asistidas. Los dias de clase iluminan solos sus musculos al abrirlos. Codo con mimo: el tiron es siempre asistido.",
  weeks: [
    {
      week: 1,
      title: "Semana 1 - Adaptacion",
      subtitle: "Aprende los movimientos, prueba la goma gruesa en dominadas y activa todo el cuerpo",
      days: [
        {
          name: "Lunes · Pierna base",
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
        { name: "Martes · YOGA (clase GoFit 60 min)", exercises: yogaDay() },
        {
          name: "Miercoles · HYBRID (clase GoFit 55 min)",
          exercises: hybridDay(),
        },
        {
          name: "Jueves · Core + Gemelos",
          exercises: [
            { exercise_id: "0274", sets: 3, reps: "15", rest_seconds: 45 },
            { exercise_id: "0872", sets: 3, reps: "12", rest_seconds: 45 },
            { exercise_id: "0620", sets: 3, reps: "10", rest_seconds: 50, notes: "Abdomen bajo, control total" },
            { exercise_id: "0594", sets: 3, reps: "15", rest_seconds: 45 },
            { exercise_id: "1373", sets: 3, reps: "20", rest_seconds: 35 },
          ],
        },
        {
          name: "Viernes · Tren superior asistido (dominadas)",
          exercises: upperDay(
            3,
            "6-8",
            "Dominada con goma GRUESA (o maquina con mucha ayuda). 3 series cortas, tecnica perfecta, CERO dolor de codo. Si duele, para y avisa"
          ),
        },
      ],
    },
    {
      week: 2,
      title: "Semana 2 - Subiendo nivel",
      subtitle: "Mas volumen en pierna y core, misma goma pero mas series de dominadas",
      days: [
        {
          name: "Lunes · Pierna progresiva",
          exercises: [
            { exercise_id: "0585", sets: 4, reps: "14", rest_seconds: 60 },
            { exercise_id: "0586", sets: 4, reps: "14", rest_seconds: 60 },
            { exercise_id: "0739", sets: 4, reps: "12", rest_seconds: 90, notes: "Sube un poco el peso respecto a semana 1" },
            { exercise_id: "1460", sets: 3, reps: "12", rest_seconds: 50, notes: "Walking lunge, cada pierna" },
            { exercise_id: "3523", sets: 3, reps: "15", rest_seconds: 50, notes: "Aprieta arriba 2 seg" },
          ],
        },
        { name: "Martes · YOGA (clase GoFit 60 min)", exercises: yogaDay() },
        {
          name: "Miercoles · HYBRID (clase GoFit 55 min)",
          exercises: hybridDay(),
        },
        {
          name: "Jueves · Core + Gemelos",
          exercises: [
            { exercise_id: "0872", sets: 4, reps: "15", rest_seconds: 45 },
            { exercise_id: "0459", sets: 3, reps: "20", rest_seconds: 40, notes: "Flutter kicks, espalda pegada al suelo" },
            { exercise_id: "0620", sets: 3, reps: "12", rest_seconds: 50 },
            { exercise_id: "0594", sets: 4, reps: "18", rest_seconds: 45 },
            { exercise_id: "1373", sets: 4, reps: "22", rest_seconds: 35 },
            { exercise_id: "0605", sets: 3, reps: "15", rest_seconds: 45 },
          ],
        },
        {
          name: "Viernes · Tren superior asistido (dominadas)",
          exercises: upperDay(
            4,
            "6-8",
            "Dominada con goma GRUESA. Una serie mas que la semana 1. Si clavas 4x8 facil, la proxima semana prueba goma media"
          ),
        },
      ],
    },
    {
      week: 3,
      title: "Semana 3 - Intensidad",
      subtitle: "Semana fuerte: prueba goma media en dominadas si la gruesa ya sale facil",
      days: [
        {
          name: "Lunes · Pierna fuerte",
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
        { name: "Martes · YOGA (clase GoFit 60 min)", exercises: yogaDay() },
        {
          name: "Miercoles · HYBRID (clase GoFit 55 min)",
          exercises: hybridDay(),
        },
        {
          name: "Jueves · Core + Gemelos",
          exercises: [
            { exercise_id: "0274", sets: 4, reps: "20", rest_seconds: 40 },
            { exercise_id: "0972", sets: 3, reps: "20", rest_seconds: 45, notes: "Bicycle crunch con banda" },
            { exercise_id: "0620", sets: 4, reps: "12", rest_seconds: 45 },
            { exercise_id: "0594", sets: 5, reps: "18", rest_seconds: 40 },
            { exercise_id: "1373", sets: 4, reps: "25", rest_seconds: 30 },
            { exercise_id: "0582", sets: 3, reps: "14", rest_seconds: 55 },
          ],
        },
        {
          name: "Viernes · Tren superior asistido (dominadas)",
          exercises: upperDay(
            4,
            "6-10",
            "Dominada con goma MEDIA si la gruesa ya sale a 4x8. Si no, sigue con gruesa a 4x10. Codo siempre sin dolor"
          ),
        },
      ],
    },
    {
      week: 4,
      title: "Semana 4 - Tope del mes",
      subtitle: "Pico del mes: tu mejor semana de dominadas asistidas y piernas",
      days: [
        {
          name: "Lunes · Pierna final",
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
        { name: "Martes · YOGA (clase GoFit 60 min)", exercises: yogaDay() },
        {
          name: "Miercoles · HYBRID (clase GoFit 55 min)",
          exercises: hybridDay(),
        },
        {
          name: "Jueves · Core + Gemelos",
          exercises: [
            { exercise_id: "0274", sets: 4, reps: "25", rest_seconds: 35 },
            { exercise_id: "0872", sets: 4, reps: "18", rest_seconds: 40 },
            { exercise_id: "0620", sets: 4, reps: "15", rest_seconds: 45 },
            { exercise_id: "0594", sets: 5, reps: "22", rest_seconds: 35 },
            { exercise_id: "1373", sets: 5, reps: "28", rest_seconds: 30 },
            { exercise_id: "0582", sets: 4, reps: "15", rest_seconds: 50 },
          ],
        },
        {
          name: "Viernes · Tren superior asistido (dominadas)",
          exercises: upperDay(
            4,
            "8-10",
            "Test del mes: goma MEDIA (o la mas fina que salga con buena tecnica). Si clavas 4x10, el mes que viene a por lastre minimo o goma fina"
          ),
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

/** 20 dias en orden para seed/upgrade en Supabase */
export const FASE_MEWTWO_FLAT_DAYS = flattenMewtwoDays();
