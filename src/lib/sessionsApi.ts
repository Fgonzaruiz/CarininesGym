import { supabase } from "./supabase";
import type { SetLog, WorkoutSession } from "../types/plan";

export async function startSession(
  owner: string,
  planId: string,
  planDayId: string,
  dayName: string
): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      owner,
      plan_id: planId,
      plan_day_id: planDayId,
      day_name: dayName,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("workout_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function upsertSetLog(input: {
  session_id: string;
  plan_exercise_id: string;
  exercise_id: string;
  exercise_name: string;
  set_index: number;
  reps_done?: number | null;
  weight_kg?: number | null;
  completed: boolean;
  existingId?: string;
}): Promise<SetLog> {
  if (input.existingId) {
    const { data, error } = await supabase
      .from("workout_set_logs")
      .update({
        reps_done: input.reps_done ?? null,
        weight_kg: input.weight_kg ?? null,
        completed: input.completed,
      })
      .eq("id", input.existingId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("workout_set_logs")
    .insert({
      session_id: input.session_id,
      plan_exercise_id: input.plan_exercise_id,
      exercise_id: input.exercise_id,
      exercise_name: input.exercise_name,
      set_index: input.set_index,
      reps_done: input.reps_done ?? null,
      weight_kg: input.weight_kg ?? null,
      completed: input.completed,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchSetLogsForSession(
  sessionId: string
): Promise<SetLog[]> {
  const { data, error } = await supabase
    .from("workout_set_logs")
    .select("*")
    .eq("session_id", sessionId);
  if (error) throw error;
  return data ?? [];
}

export async function fetchHistory(
  owner: string,
  limit = 30
): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("owner", owner)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
