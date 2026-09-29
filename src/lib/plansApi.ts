import { supabase } from "./supabase";
import { FASE_MEWTWO_FLAT_DAYS, FASE_MEWTWO_PLAN } from "../data/defaultPlan";
import { classDayKindFromName, CLASS_VIRTUAL_IDS } from "./classDays";
import type { SeedDay } from "../data/defaultPlan";
import { RUTINA_5_DIAS_PLAN } from "../data/routine5dias";
import type { Plan, PlanDay, PlanExercise } from "../types/plan";

interface RawPlanRow {
  id: string;
  owner: string;
  name: string;
  description: string;
  is_default: boolean;
  created_at: string;
}

interface RawDayRow {
  id: string;
  plan_id: string;
  day_index: number;
  name: string;
}

interface RawExerciseRow {
  id: string;
  plan_day_id: string;
  order_index: number;
  exercise_id: string;
  original_exercise_id: string | null;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string | null;
  substituted_at: string | null;
}

export async function fetchPlans(owner: string): Promise<Plan[]> {
  const { data: plans, error: plansError } = await supabase
    .from("plans")
    .select("*")
    .eq("owner", owner)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (plansError) throw plansError;
  if (!plans || plans.length === 0) return [];

  const planIds = plans.map((p: RawPlanRow) => p.id);

  const { data: days, error: daysError } = await supabase
    .from("plan_days")
    .select("*")
    .in("plan_id", planIds)
    .order("day_index", { ascending: true });
  if (daysError) throw daysError;

  const dayIds = (days ?? []).map((d: RawDayRow) => d.id);

  const { data: exercises, error: exercisesError } = dayIds.length
    ? await supabase
        .from("plan_exercises")
        .select("*")
        .in("plan_day_id", dayIds)
        .order("order_index", { ascending: true })
    : { data: [] as RawExerciseRow[], error: null };
  if (exercisesError) throw exercisesError;

  const exercisesByDay = new Map<string, PlanExercise[]>();
  for (const ex of exercises ?? []) {
    const list = exercisesByDay.get(ex.plan_day_id) ?? [];
    list.push(ex as PlanExercise);
    exercisesByDay.set(ex.plan_day_id, list);
  }

  const daysByPlan = new Map<string, PlanDay[]>();
  for (const day of days ?? []) {
    const list = daysByPlan.get(day.plan_id) ?? [];
    list.push({
      ...day,
      exercises: exercisesByDay.get(day.id) ?? [],
    });
    daysByPlan.set(day.plan_id, list);
  }

  return plans.map((p: RawPlanRow) => ({
    ...p,
    days: daysByPlan.get(p.id) ?? [],
  }));
}

export async function seedDefaultPlanIfNeeded(owner: string): Promise<void> {
  if (owner !== "Knifey") return;

  const { count, error: countError } = await supabase
    .from("plans")
    .select("id", { count: "exact", head: true })
    .eq("owner", owner);
  if (countError) throw countError;
  if (count && count > 0) return;

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .insert({
      owner,
      name: FASE_MEWTWO_PLAN.name,
      description: FASE_MEWTWO_PLAN.description,
      is_default: true,
    })
    .select()
    .single();
  if (planError) throw planError;

  await insertMewtwoDays(plan.id, FASE_MEWTWO_FLAT_DAYS, 0);
}

async function insertMewtwoDays(
  planId: string,
  days: SeedDay[],
  startIndex: number
): Promise<void> {
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const { data: dayRow, error: dayError } = await supabase
      .from("plan_days")
      .insert({
        plan_id: planId,
        day_index: startIndex + i,
        name: day.name,
      })
      .select()
      .single();
    if (dayError) throw dayError;

    const exerciseRows = day.exercises.map((ex, idx) => ({
      plan_day_id: dayRow.id,
      order_index: idx,
      exercise_id: ex.exercise_id,
      sets: ex.sets,
      reps: ex.reps,
      rest_seconds: ex.rest_seconds,
      notes: ex.notes ?? null,
    }));
    if (exerciseRows.length) {
      const { error: exError } = await supabase
        .from("plan_exercises")
        .insert(exerciseRows);
      if (exError) throw exError;
    }
  }
}

/** Crea la rutina de 5 días de Forky si todavía no la tiene. */
export async function ensureRoutinePlanIfNeeded(owner: string): Promise<void> {
  if (owner !== "Forky") return;

  const { data: existing, error: existsError } = await supabase
    .from("plans")
    .select("id")
    .eq("owner", owner)
    .eq("name", RUTINA_5_DIAS_PLAN.name);
  if (existsError) throw existsError;
  if (existing && existing.length > 0) return;

  await createGeneratedPlan(
    owner,
    { name: RUTINA_5_DIAS_PLAN.name, description: RUTINA_5_DIAS_PLAN.description },
    RUTINA_5_DIAS_PLAN.days
  );
}

/**
 * Migra el plan de Knifey al formato actual: UNA semana de 5 dias que se
 * repite (como la rutina de Forky). Si el plan es antiguo (varias semanas,
 * 16/20 dias, o sin la estructura YOGA/HYBRID/Tren superior en bloque unico),
 * reconstruye los 5 dias. El historial se conserva porque
 * workout_sessions.plan_day_id es ON DELETE SET NULL.
 */
export async function upgradeKnifeyPlanIfNeeded(owner: string): Promise<void> {
  if (owner !== "Knifey") return;

  const { data: plans, error: plansError } = await supabase
    .from("plans")
    .select("id, name, description")
    .eq("owner", owner)
    .eq("is_default", true);
  if (plansError) throw plansError;

  const knifey = (plans ?? []).find((p) => p.name === FASE_MEWTWO_PLAN.name);
  if (!knifey) return;

  if (knifey.description !== FASE_MEWTWO_PLAN.description) {
    await supabase
      .from("plans")
      .update({ description: FASE_MEWTWO_PLAN.description })
      .eq("id", knifey.id);
  }

  const { data: days, error: daysError } = await supabase
    .from("plan_days")
    .select("id, name")
    .eq("plan_id", knifey.id)
    .order("day_index", { ascending: true });
  if (daysError) throw daysError;

  const dayList = days ?? [];
  const names = dayList.map((d) => (d.name ?? "").toLowerCase());
  const hasUpperDay = names.some(
    (n) => n.includes("tren superior") || n.includes("dominada")
  );

  // Los dias de clase deben ser un bloque unico (id virtual).
  const classDayIds = dayList.filter((d) => classDayKindFromName(d.name)).map((d) => d.id);
  let classDaysAreSingleBlock = classDayIds.length === 2;
  if (classDaysAreSingleBlock) {
    const { data: classExs, error: classExsError } = await supabase
      .from("plan_exercises")
      .select("plan_day_id, exercise_id")
      .in("plan_day_id", classDayIds);
    if (classExsError) throw classExsError;
    const byDay = new Map<string, string[]>();
    for (const row of classExs ?? []) {
      const list = byDay.get(row.plan_day_id) ?? [];
      list.push(row.exercise_id);
      byDay.set(row.plan_day_id, list);
    }
    const virtualIds = new Set(Object.values(CLASS_VIRTUAL_IDS));
    for (const dayId of classDayIds) {
      const ids = byDay.get(dayId) ?? [];
      if (ids.length !== 1 || !virtualIds.has(ids[0])) {
        classDaysAreSingleBlock = false;
        break;
      }
    }
  }

  const isUpToDate =
    dayList.length === FASE_MEWTWO_FLAT_DAYS.length && hasUpperDay && classDaysAreSingleBlock;
  if (isUpToDate) return;

  const { error: deleteError } = await supabase
    .from("plan_days")
    .delete()
    .eq("plan_id", knifey.id);
  if (deleteError) throw deleteError;
  await insertMewtwoDays(knifey.id, FASE_MEWTWO_FLAT_DAYS, 0);
}



export async function createPlan(
  owner: string,
  input: { name: string; description: string }
): Promise<Plan> {
  const { data, error } = await supabase
    .from("plans")
    .insert({ owner, ...input })
    .select()
    .single();
  if (error) throw error;
  return { ...data, days: [] };
}

/** Crea un plan generado de golpe (plan + días + ejercicios en bloques). */
export async function createGeneratedPlan(
  owner: string,
  input: { name: string; description: string },
  days: Array<{
    name: string;
    exercises: Array<{
      exercise_id: string;
      sets: number;
      reps: string;
      rest_seconds: number;
      notes?: string;
    }>;
  }>
): Promise<Plan> {
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .insert({ owner, name: input.name, description: input.description })
    .select()
    .single();
  if (planError) throw planError;

  const dayRows = days.map((d, i) => ({ plan_id: plan.id, day_index: i, name: d.name }));
  const { data: insertedDays, error: daysError } = await supabase
    .from("plan_days")
    .insert(dayRows)
    .select();
  if (daysError) throw daysError;

  const dayIdByIndex = new Map<number, string>();
  for (const d of insertedDays ?? []) dayIdByIndex.set(d.day_index, d.id);

  const exerciseRows = days.flatMap((d, i) =>
    d.exercises.map((ex, idx) => ({
      plan_day_id: dayIdByIndex.get(i)!,
      order_index: idx,
      exercise_id: ex.exercise_id,
      sets: ex.sets,
      reps: ex.reps,
      rest_seconds: ex.rest_seconds,
      notes: ex.notes ?? null,
    }))
  );
  if (exerciseRows.length) {
    const { error: exError } = await supabase.from("plan_exercises").insert(exerciseRows);
    if (exError) throw exError;
  }

  return { ...plan, days: [] };
}

export async function deletePlan(planId: string): Promise<void> {
  const { error } = await supabase.from("plans").delete().eq("id", planId);
  if (error) throw error;
}

export async function updatePlan(
  planId: string,
  input: Partial<{ name: string; description: string }>
): Promise<void> {
  const { error } = await supabase.from("plans").update(input).eq("id", planId);
  if (error) throw error;
}

export async function addPlanDay(
  planId: string,
  dayIndex: number,
  input: { name: string }
): Promise<PlanDay> {
  const { data, error } = await supabase
    .from("plan_days")
    .insert({ plan_id: planId, day_index: dayIndex, ...input })
    .select()
    .single();
  if (error) throw error;
  return { ...data, exercises: [] };
}

export async function deletePlanDay(dayId: string): Promise<void> {
  const { error } = await supabase.from("plan_days").delete().eq("id", dayId);
  if (error) throw error;
}

export async function addExerciseToDay(
  dayId: string,
  orderIndex: number,
  input: { exercise_id: string; sets: number; reps: string; rest_seconds: number; notes?: string }
): Promise<PlanExercise> {
  const { data, error } = await supabase
    .from("plan_exercises")
    .insert({ plan_day_id: dayId, order_index: orderIndex, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlanExercise(
  id: string,
  input: Partial<{
    sets: number;
    reps: string;
    rest_seconds: number;
    notes: string | null;
  }>
): Promise<void> {
  const { error } = await supabase
    .from("plan_exercises")
    .update(input)
    .eq("id", id);
  if (error) throw error;
}

export async function removePlanExercise(id: string): Promise<void> {
  const { error } = await supabase.from("plan_exercises").delete().eq("id", id);
  if (error) throw error;
}

/** Sustituye un ejercicio de un plan por otro similar y lo deja guardado en ese hueco. */
export async function substituteExercise(
  planExerciseId: string,
  currentExerciseId: string,
  newExerciseId: string,
  originalExerciseId: string | null
): Promise<void> {
  const { error } = await supabase
    .from("plan_exercises")
    .update({
      exercise_id: newExerciseId,
      original_exercise_id: originalExerciseId ?? currentExerciseId,
      substituted_at: new Date().toISOString(),
    })
    .eq("id", planExerciseId);
  if (error) throw error;
}

export async function restoreOriginalExercise(
  planExerciseId: string,
  originalExerciseId: string
): Promise<void> {
  const { error } = await supabase
    .from("plan_exercises")
    .update({
      exercise_id: originalExerciseId,
      original_exercise_id: null,
      substituted_at: null,
    })
    .eq("id", planExerciseId);
  if (error) throw error;
}
