// Rutina de 5 dias de Forky: Empuje / Tiron / Pierna / Cardio+Core / Full Body.
// Todos los exercise_id estan verificados contra public/data/exercises.json.
import type { SeedDay } from "./defaultPlan";

export const RUTINA_5_DIAS_PLAN = {
  name: "Rutina 5 días",
  description:
    "Empuje, Tirón, Pierna, Cardio+Core y Full Body. 5-6 ejercicios por sesión con series, reps, descansos y notas técnicas. Sube peso o reps cada 2 semanas en los ejercicios principales (los de 4 series).",
  days: [
    {
      name: "Día 1 · Empuje (Pecho, Hombro, Tríceps)",
      exercises: [
        {
          exercise_id: "0025",
          sets: 4,
          reps: "8-10",
          rest_seconds: 105,
          notes: "Press banca plano (barra o mancuernas). Base del pecho, prioridad",
        },
        {
          exercise_id: "0314",
          sets: 3,
          reps: "10-12",
          rest_seconds: 90,
          notes: "Press inclinado con mancuernas. Pecho superior, punto débil típico",
        },
        {
          exercise_id: "1457",
          sets: 4,
          reps: "8-10",
          rest_seconds: 90,
          notes: "Press militar de pie. Hombro anterior + core",
        },
        {
          exercise_id: "0334",
          sets: 3,
          reps: "15",
          rest_seconds: 60,
          notes: "Elevaciones laterales. Clave para el ancho de hombro (efecto V)",
        },
        {
          exercise_id: "0251",
          sets: 3,
          reps: "10-12",
          rest_seconds: 60,
          notes: "Fondos en paralelas o banco. Tríceps + pecho bajo",
        },
        {
          exercise_id: "0194",
          sets: 3,
          reps: "12-15",
          rest_seconds: 45,
          notes: "Extensión de tríceps en polea. Aislamiento final",
        },
      ],
    },
    {
      name: "Día 2 · Tirón (Espalda, Bíceps, Postura)",
      exercises: [
        {
          exercise_id: "0651",
          sets: 4,
          reps: "8-10",
          rest_seconds: 105,
          notes: "Dominadas (o jalón al pecho si aún no llegas). Ancho de espalda",
        },
        {
          exercise_id: "0027",
          sets: 4,
          reps: "8-10",
          rest_seconds: 90,
          notes: "Remo con barra. Grosor de espalda",
        },
        {
          exercise_id: "0292",
          sets: 3,
          reps: "10-12",
          rest_seconds: 60,
          notes: "Remo a una mano con mancuerna. Corrige asimetrías",
        },
        {
          exercise_id: "0203",
          sets: 3,
          reps: "15-20",
          rest_seconds: 45,
          notes: "Face pulls. Prioridad postural, hombro posterior",
        },
        {
          exercise_id: "0031",
          sets: 3,
          reps: "10-12",
          rest_seconds: 60,
          notes: "Curl de bíceps con barra",
        },
        {
          exercise_id: "1648",
          sets: 3,
          reps: "12",
          rest_seconds: 45,
          notes: "Curl martillo. Antebrazo + braquial",
        },
      ],
    },
    {
      name: "Día 3 · Pierna Completa",
      exercises: [
        {
          exercise_id: "0043",
          sets: 4,
          reps: "8-10",
          rest_seconds: 120,
          notes: "Sentadilla con barra. Base de todo el tren inferior",
        },
        {
          exercise_id: "0085",
          sets: 4,
          reps: "8-10",
          rest_seconds: 105,
          notes: "Peso muerto rumano. Femoral + glúteo",
        },
        {
          exercise_id: "0739",
          sets: 3,
          reps: "12",
          rest_seconds: 90,
          notes: "Prensa o zancadas. Volumen extra de cuádriceps",
        },
        {
          exercise_id: "3523",
          sets: 3,
          reps: "12-15",
          rest_seconds: 60,
          notes: "Hip thrust. Glúteo, mejora la silueta de cadera",
        },
        {
          exercise_id: "0605",
          sets: 4,
          reps: "15-20",
          rest_seconds: 45,
          notes: "Elevación de gemelos",
        },
      ],
    },
    {
      name: "Día 4 · Cardio + Core (activo, no destructivo)",
      exercises: [
        {
          exercise_id: "3666",
          sets: 1,
          reps: "25-30 min",
          rest_seconds: 0,
          notes: "Zona 2, ritmo conversacional. Bici, caminata inclinada o remo",
        },
        {
          exercise_id: "0464",
          sets: 3,
          reps: "40-60 seg",
          rest_seconds: 45,
          notes: "Plancha. Control de tronco",
        },
        {
          exercise_id: "0276",
          sets: 3,
          reps: "12 por lado",
          rest_seconds: 45,
          notes: "Dead bug. Estabilidad lumbar",
        },
        {
          exercise_id: "0979",
          sets: 3,
          reps: "12 por lado",
          rest_seconds: 45,
          notes: "Pallof press. Anti-rotación, control del tronco",
        },
        {
          exercise_id: "0857",
          sets: 3,
          reps: "8-10",
          rest_seconds: 60,
          notes: "Rueda abdominal (o variante de rodillas). Core avanzado",
        },
      ],
    },
    {
      name: "Día 5 · Full Body (fuerza general + puntos débiles)",
      exercises: [
        {
          exercise_id: "0032",
          sets: 4,
          reps: "6-8",
          rest_seconds: 120,
          notes: "Peso muerto convencional. Fuerza global",
        },
        {
          exercise_id: "0047",
          sets: 3,
          reps: "10",
          rest_seconds: 90,
          notes: "Press banca inclinado. Refuerzo del pecho superior",
        },
        {
          exercise_id: "0861",
          sets: 3,
          reps: "10",
          rest_seconds: 90,
          notes: "Remo en máquina o polea. Refuerzo de espalda",
        },
        {
          exercise_id: "0426",
          sets: 3,
          reps: "10",
          rest_seconds: 60,
          notes: "Press militar con mancuernas",
        },
        {
          exercise_id: "0334",
          sets: 3,
          reps: "15",
          rest_seconds: 60,
          notes: "Elevaciones laterales — superserie con face pulls. Termina el hombro completo",
        },
        {
          exercise_id: "0203",
          sets: 3,
          reps: "15",
          rest_seconds: 60,
          notes: "Face pulls — superserie con elevaciones laterales",
        },
      ],
    },
  ] satisfies SeedDay[],
};
