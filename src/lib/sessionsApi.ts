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
  history: ExerciseHistoryPoint[];
}

export interface ExerciseHistoryPoint {
  date: string;
  weight: number;
  reps: number;
  volume: number;
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

  /** Agrega por sesion y ejercicio */
  const sessionExercise = new Map<
    string,
    { date: string; weight: number; reps: number; volume: number; name: string }
  >();

  for (const log of logs) {
    const date = sessionDates.get(log.session_id) ?? "";
    const weight = Number(log.weight_kg) || 0;
    const reps = Number(log.reps_done) || 0;
    const key = `${log.exercise_id}:${log.session_id}`;

    const cur = sessionExercise.get(key);
    if (!cur) {
      sessionExercise.set(key, {
        date,
        weight,
        reps,
        volume: weight * reps,
        name: log.exercise_name || log.exercise_id,
      });
    } else {
      cur.weight = Math.max(cur.weight, weight);
      cur.reps = Math.max(cur.reps, reps);
      cur.volume += weight * reps;
    }
  }

  const byExercise = new Map<string, ExerciseEvolution>();

  for (const [key, point] of sessionExercise) {
    const exerciseId = key.split(":")[0];
    if (!byExercise.has(exerciseId)) {
      byExercise.set(exerciseId, {
        exercise_id: exerciseId,
        exercise_name: point.name,
        sessions: 0,
        best_weight: 0,
        best_reps: 0,
        total_volume: 0,
        history: [],
      });
    }

    const entry = byExercise.get(exerciseId)!;
    entry.best_weight = Math.max(entry.best_weight, point.weight);
    entry.best_reps = Math.max(entry.best_reps, point.reps);
    entry.total_volume += point.volume;
    entry.history.push({
      date: point.date,
      weight: point.weight,
      reps: point.reps,
      volume: point.volume,
    });
  }

  for (const entry of byExercise.values()) {
    entry.history.sort((a, b) => a.date.localeCompare(b.date));
    entry.sessions = entry.history.length;
  }

  return Array.from(byExercise.values()).sort((a, b) => b.total_volume - a.total_volume);
}

/** Borra todo el historial de entrenos del perfil (sesiones y series). */
export async function clearAllProgress(owner: string): Promise<void> {
  const { error } = await supabase.from("workout_sessions").delete().eq("owner", owner);
  if (error) throw error;
}

export interface LastExerciseLog {
  weight_kg: number | null;
  reps_done: number | null;
}

/** Ultimo peso/reps registrados por ejercicio (para sugerencias en entreno). */
export async function fetchLastLogsByExercise(
  owner: string
): Promise<Map<string, LastExerciseLog>> {
  const { data: sessions, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("owner", owner)
    .not("completed_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(80);
  if (sErr) throw sErr;

  const sessionIds = (sessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0) return new Map();

  const { data: logs, error: lErr } = await supabase
    .from("workout_set_logs")
    .select("exercise_id, weight_kg, reps_done, created_at")
    .in("session_id", sessionIds)
    .eq("completed", true)
    .order("created_at", { ascending: false });
  if (lErr) throw lErr;

  const map = new Map<string, LastExerciseLog>();
  for (const log of logs ?? []) {
    if (!map.has(log.exercise_id)) {
      map.set(log.exercise_id, {
        weight_kg: log.weight_kg != null ? Number(log.weight_kg) : null,
        reps_done: log.reps_done != null ? Number(log.reps_done) : null,
      });
    }
  }
  return map;
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
