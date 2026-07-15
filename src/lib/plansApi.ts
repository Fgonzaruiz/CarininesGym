import { supabase } from "./supabase";
import { FASE_MEWTWO_PLAN } from "../data/defaultPlan";
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

  for (let i = 0; i < FASE_MEWTWO_PLAN.days.length; i++) {
    const day = FASE_MEWTWO_PLAN.days[i];
    const { data: dayRow, error: dayError } = await supabase
      .from("plan_days")
      .insert({
        plan_id: plan.id,
        day_index: i,
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
