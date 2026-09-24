// Rutina de 5 dias de Forky v3: Empuje / Tiron / Pierna / Cardio+Core / Full Body pump (opcional corto).
// Rotación por variedad para hipertrofia (mismo patrón, distintas variantes).
// Todos los exercise_id estan verificados contra public/data/exercises.json.
// Protocolo general (doble progresion):
// - Son ejercicios NUEVOS: empieza ligero 2 semanas para coger técnica, apunta todo.
// - Cuando clavas el TOPE del rango en TODAS las series con buena tecnica, sube peso:
//   superior +2/+2.5kg, mancuernas +2kg por mano, polea/máquina +2.5kg, pierna +5kg.
// - Apunta SIEMPRE peso y reps al terminar cada serie.
import type { SeedDay } from "./defaultPlan";

export const RUTINA_5_DIAS_PLAN = {
  name: "Rutina 5 días",
  description:
    "Empuje, Tirón, Pierna, Cardio+Core y Full Body pump opcional (40 min). Rotación de variantes para romper estancamiento y aburrimiento. Son ejercicios nuevos: ve ligero 2 semanas y luego aplica doble progresión (si clavas el tope en todas, sube peso).",
  days: [
    {
      name: "Día 1 · Empuje (Pecho, Hombro, Tríceps)",
      exercises: [
        {
          exercise_id: "0289",
          sets: 4,
          reps: "8-12",
          rest_seconds: 120,
          notes:
            "Press plano con mancuernas (antes barra). Más recorrido. Empieza ~32-36kg por mano, a 4x12 sube +2kg",
        },
        {
          exercise_id: "0047",
          sets: 3,
          reps: "8-12",
          rest_seconds: 105,
          notes:
            "Press inclinado con barra (antes manc). Carga más fácil. Empieza ~60-70kg, a 3x12 sube +2.5kg",
        },
        {
          exercise_id: "0426",
          sets: 3,
          reps: "10-15",
          rest_seconds: 90,
          notes:
            "Press militar con mancuernas de pie (antes barra). Más amable de hombro. A 3x15 sube +2kg",
        },
        {
          exercise_id: "0192",
          sets: 3,
          reps: "12-20",
          rest_seconds: 60,
          notes:
            "Lateral en polea a una mano (antes manc). Tensión constante. Pausa 1s arriba. A 3x20 sube +1.25kg",
        },
        {
          exercise_id: "0030",
          sets: 3,
          reps: "8-12",
          rest_seconds: 90,
          notes:
            "Press cerrado con barra (en vez de fondos). Masa de tríceps sin colgarte. A 3x12 sube +2.5kg",
        },
        {
          exercise_id: "0201",
          sets: 3,
          reps: "12-20",
          rest_seconds: 60,
          notes:
            "Pushdown en polea (antes overhead). Codos pegados. Última serie al fallo. A 3x20 sube +2.5kg",
        },
      ],
    },
    {
      name: "Día 2 · Tirón (Espalda, Bíceps, Postura)",
      exercises: [
        {
          exercise_id: "0140",
          sets: 4,
          reps: "6-10",
          rest_seconds: 120,
          notes:
            "Dominada supina / chin-up (antes neutra). Más bíceps. Cuando hagas 4x10, lastra +5kg",
        },
        {
          exercise_id: "3017",
          sets: 4,
          reps: "6-10",
          rest_seconds: 120,
          notes:
            "Remo Pendlay desde suelo (antes remo barra). Explosivo, espalda recta. A 4x10 sube +2.5kg",
        },
        {
          exercise_id: "0180",
          sets: 3,
          reps: "10-15",
          rest_seconds: 75,
          notes:
            "Remo bajo en polea sentado (antes manc a una mano). Aprieta 1s. A 3x15 sube +2.5kg",
        },
        {
          exercise_id: "0215",
          sets: 3,
          reps: "15-20",
          rest_seconds: 60,
          notes:
            "Lateral posterior en polea sentado (en vez de face pulls). Hombro posterior. Ligero y estricto",
        },
        {
          exercise_id: "0070",
          sets: 3,
          reps: "8-12",
          rest_seconds: 75,
          notes:
            "Curl predicador con barra (antes curl de pie). Sin trampas. A 3x12 sube +2.5kg",
        },
        {
          exercise_id: "0165",
          sets: 3,
          reps: "12-15",
          rest_seconds: 60,
          notes:
            "Martillo en polea con cuerda (antes manc). Tensión constante. A 3x15 sube +2.5kg",
        },
      ],
    },
    {
      name: "Día 3 · Pierna Completa",
      exercises: [
        {
          exercise_id: "0046",
          sets: 4,
          reps: "8-12",
          rest_seconds: 150,
          notes:
            "Hack squat con barra (en vez de sentadilla libre). Más cuádriceps, menos lumbar. Aprende técnica ligero",
        },
        {
          exercise_id: "0586",
          sets: 4,
          reps: "10-15",
          rest_seconds: 90,
          notes:
            "Femoral tumbado en máquina (en vez de RDL ligero). Aísla femoral. A 4x15 sube +5kg. Apunta placas",
        },
        {
          exercise_id: "0099",
          sets: 3,
          reps: "10-12 por lado",
          rest_seconds: 105,
          notes:
            "Búlgara con barra/manc (en vez de prensa). Corrige asimetrías. Empieza ligero, a 3x12 sube +2.5kg",
        },
        {
          exercise_id: "1409",
          sets: 3,
          reps: "10-15",
          rest_seconds: 90,
          notes:
            "Puente de glúteo con barra (antes peso corporal). Por fin con carga: empieza 40-60kg, aprieta 2s",
        },
        {
          exercise_id: "0088",
          sets: 4,
          reps: "12-20",
          rest_seconds: 60,
          notes:
            "Gemelo sentado con barra (antes de pie). Trabaja sóleo. Pausa 1s. A 4x20 sube +5kg",
        },
      ],
    },
    {
      name: "Día 4 · Cardio + Core (activo, no destructivo)",
      exercises: [
        {
          exercise_id: "3666",
          sets: 1,
          reps: "30-35 min",
          rest_seconds: 0,
          notes:
            "Zona 2 conversacional (cinta inclinada, bici o remo). Suma +2 min/semana hasta 35 min",
        },
        {
          exercise_id: "2963",
          sets: 3,
          reps: "12-20",
          rest_seconds: 60,
          notes:
            "Elevación de piernas en silla del capitán (nuevo). Abdomen bajo. Controlado, sin balanceo",
        },
        {
          exercise_id: "0620",
          sets: 3,
          reps: "12-20",
          rest_seconds: 45,
          notes: "Elevación de piernas en banco (en vez de dead bug). Lumbar pegada",
        },
        {
          exercise_id: "0979",
          sets: 3,
          reps: "12-15 por lado",
          rest_seconds: 45,
          notes: "Pallof press. Se mantiene: anti-rotación. Pausa 2s fuera",
        },
        {
          exercise_id: "0175",
          sets: 3,
          reps: "12-20",
          rest_seconds: 60,
          notes:
            "Crunch en polea de rodillas (en vez de rueda). Fácil de lastrar. A 3x20 sube +2.5kg",
        },
      ],
    },
    {
      name: "Día 5 · Full Body pump (opcional, 40 min)",
      exercises: [
        {
          exercise_id: "0169",
          sets: 3,
          reps: "12-15",
          rest_seconds: 75,
          notes: "Press inclinado en polea. Bombeo pecho superior. Ligero",
        },
        {
          exercise_id: "0150",
          sets: 3,
          reps: "10-15",
          rest_seconds: 75,
          notes: "Jalón al pecho en polea. Espalda ancha sin fatigar",
        },
        {
          exercise_id: "0585",
          sets: 2,
          reps: "12-15",
          rest_seconds: 75,
          notes: "Extensión de cuádriceps en máquina. Por fin pierna en el full body. Aprieta 1s",
        },
        {
          exercise_id: "0334",
          sets: 2,
          reps: "15-20",
          rest_seconds: 45,
          notes:
            "Laterales con manc + face pulls en superserie con 0203. Hombro completo",
        },
        {
          exercise_id: "0203",
          sets: 2,
          reps: "15-20",
          rest_seconds: 60,
          notes: "Face pulls (2ª parte de la superserie). Ligero 12.5-15kg",
        },
      ],
    },
  ] satisfies SeedDay[],
};
