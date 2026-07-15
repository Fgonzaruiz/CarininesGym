import { supabase } from "./supabase";
import type { SetLog, WorkoutSession } from "../types/plan";

export interface SetLogRow extends SetLog {
  exercise_id: string;
  exercise_name: string;
  created_at: string;
}

export interface ExerciseEvolution {
  exercise_id: string;
  exercise_name: string;
  sessions: number;
  best_weight: number;
  best_reps: number;
  total_volume: number;
  history: { date: string; weight: number; reps: number }[];
}

export async function startSession(
  owner: string,
  planId: string,
  planDayId: string,
  dayName: string
): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({ owner, plan_id: planId, plan_day_id: planDayId, day_name: dayName })
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
  const payload = {
    reps_done: input.reps_done ?? null,
    weight_kg: input.weight_kg ?? null,
    completed: input.completed,
  };

  if (input.existingId) {
    const { data, error } = await supabase
      .from("workout_set_logs")
      .update(payload)
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
      ...payload,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchSetLogsForSession(sessionId: string): Promise<SetLogRow[]> {
  const { data, error } = await supabase
    .from("workout_set_logs")
    .select("*")
    .eq("session_id", sessionId)
    .order("set_index", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchHistory(owner: string, limit = 30): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("owner", owner)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchEvolution(owner: string): Promise<ExerciseEvolution[]> {
  const { data: sessions, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id, started_at, completed_at")
    .eq("owner", owner)
    .not("completed_at", "is", null)
    .order("started_at", { ascending: true });
  if (sErr) throw sErr;
  if (!sessions?.length) return [];

  const sessionIds = sessions.map((s) => s.id);
  const sessionDates = new Map(sessions.map((s) => [s.id, s.started_at.slice(0, 10)]));

  const { data: logs, error: lErr } = await supabase
    .from("workout_set_logs")
    .select("*")
    .in("session_id", sessionIds)
    .eq("completed", true);
  if (lErr) throw lErr;
  if (!logs?.length) return [];

  const byExercise = new Map<string, ExerciseEvolution>();

  for (const log of logs) {
    const key = log.exercise_id;
    const date = sessionDates.get(log.session_id) ?? "";
    const weight = Number(log.weight_kg) || 0;
    const reps = Number(log.reps_done) || 0;

    if (!byExercise.has(key)) {
      byExercise.set(key, {
        exercise_id: key,
        exercise_name: log.exercise_name || key,
        sessions: 0,
        best_weight: 0,
        best_reps: 0,
        total_volume: 0,
        history: [],
      });
    }

    const entry = byExercise.get(key)!;
    entry.best_weight = Math.max(entry.best_weight, weight);
    entry.best_reps = Math.max(entry.best_reps, reps);
    entry.total_volume += weight * reps;
    entry.history.push({ date, weight, reps });
  }

  for (const entry of byExercise.values()) {
    const uniqueDates = new Set(entry.history.map((h) => h.date));
    entry.sessions = uniqueDates.size;
    entry.history.sort((a, b) => a.date.localeCompare(b.date));
  }

  return Array.from(byExercise.values()).sort((a, b) => b.total_volume - a.total_volume);
}

export async function fetchStats(owner: string) {
  const history = await fetchHistory(owner, 100);
  const completed = history.filter((h) => h.completed_at);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const thisWeek = completed.filter((h) => new Date(h.started_at) >= weekStart).length;
  const total = completed.length;

  return { thisWeek, total, lastSession: completed[0] ?? null };
}
