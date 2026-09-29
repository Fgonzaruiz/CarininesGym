import { supabaseUrl, supabaseAnonKey } from "./supabase";
import { INJURY_IDS, type InjuryId } from "./injuries";

/**
 * Cliente del navegador para la Edge Function "nemotron" de Supabase.
 * La API key de NVIDIA vive en la función (secret), nunca aquí.
 */

const FUNCTIONS_URL = `${supabaseUrl ?? ""}/functions/v1/nemotron`;

export interface DayExerciseBrief {
  /** id del hueco en el plan (plan_exercises.id) */
  peId: string;
  /** id del ejercicio en el catálogo */
  exerciseId: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
}

export interface CandidateBrief {
  id: string;
  name: string;
}

export interface InjuriesResult {
  injuries: InjuryId[];
  explanation: string;
}

export interface PickResult {
  exerciseId: string;
  reason: string;
}

async function callNemotron<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase no está configurado en .env.local");
  }

  let res: Response;
  try {
    res = await fetch(FUNCTIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    throw new Error(
      "No se pudo contactar con el asistente. Comprueba tu conexión y que la función 'nemotron' esté desplegada en Supabase."
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      const data = (await res.json()) as { error?: string };
      detail = data.error ?? "";
    } catch {
      // cuerpo no JSON
    }
    throw new Error(detail || `El asistente respondió con error (${res.status}).`);
  }

  return (await res.json()) as T;
}

/**
 * Paso 1: traduce el mensaje libre del usuario a zonas doloridas
 * (`InjuryId`s que la app ya entiende).
 */
export async function detectInjuries(message: string): Promise<InjuriesResult> {
  const raw = await callNemotron<{ injuries?: unknown; explanation?: unknown }>(
    "injuries",
    { message }
  );
  const injuries = Array.isArray(raw.injuries)
    ? raw.injuries.filter(
        (id): id is InjuryId =>
          typeof id === "string" && INJURY_IDS.includes(id as InjuryId)
      )
    : [];
  return {
    injuries: [...new Set(injuries)],
    explanation: typeof raw.explanation === "string" ? raw.explanation : "",
  };
}

/**
 * Paso 2: para un ejercicio que molesta, elige una candidata segura del
 * catálogo y explica el porqué.
 */
export async function pickSubstitute(
  message: string,
  exercise: DayExerciseBrief,
  candidates: CandidateBrief[]
): Promise<PickResult> {
  if (candidates.length === 0) {
    throw new Error("No hay candidatas seguras para este ejercicio.");
  }
  const raw = await callNemotron<{ exerciseId?: unknown; reason?: unknown }>(
    "pick",
    { message, exercise, candidates }
  );
  const allowedIds = new Set(candidates.map((c) => c.id));
  const exerciseId =
    typeof raw.exerciseId === "string" && allowedIds.has(raw.exerciseId)
      ? raw.exerciseId
      : candidates[0].id;
  return {
    exerciseId,
    reason:
      typeof raw.reason === "string" && raw.reason
        ? raw.reason
        : "Mejor opción segura disponible.",
  };
}