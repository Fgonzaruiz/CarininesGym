import { supabase } from "./supabase";
import type { SetLog, WorkoutSession, SessionType } from "../types/plan";

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
  dayName: string,
  sessionType: SessionType = "fuerza"
): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      owner,
      plan_id: planId,
      plan_day_id: planDayId,
      day_name: dayName,
      session_type: sessionType,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSession(
  sessionId: string,
  input: Partial<{
    session_type: SessionType;
    duration_minutes: number | null;
    notes: string | null;
  }>
): Promise<void> {
  const { error } = await supabase
    .from("workout_sessions")
    .update(input)
    .eq("id", sessionId);
  if (error) throw error;
}

/** Registra un entreno libre (sin plan): tabata, hybrid, cardio... o lo que sea. */
export async function quickLogSession(
  owner: string,
  input: {
    session_type: SessionType;
    duration_minutes: number | null;
    notes: string | null;
  }
): Promise<WorkoutSession> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      owner,
      plan_id: null,
      plan_day_id: null,
      day_name: "Día libre",
      started_at: now,
      completed_at: now,
      session_type: input.session_type,
      duration_minutes: input.duration_minutes,
      notes: input.notes,
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

/** Ejercicios distintos (con series completadas) por sesión terminada en el periodo. */
export async function fetchExerciseIdsBySessionInRange(
  owner: string,
  period: MusclePeriod
): Promise<Map<string, string[]>> {
  const { from, to } = musclePeriodRange(period);

  const { data: sessions, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("owner", owner)
    .not("completed_at", "is", null)
    .gte("completed_at", from.toISOString())
    .lt("completed_at", to.toISOString());
  if (sErr) throw sErr;

  const map = new Map<string, string[]>();
  const sessionIds = (sessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0) return map;

  const { data: logs, error: lErr } = await supabase
    .from("workout_set_logs")
    .select("session_id, exercise_id")
    .in("session_id", sessionIds)
    .eq("completed", true);
  if (lErr) throw lErr;

  for (const log of logs ?? []) {
    const list = map.get(log.session_id) ?? [];
    if (!list.includes(log.exercise_id)) list.push(log.exercise_id);
    map.set(log.session_id, list);
  }
  return map;
}

export interface LastExerciseLog {
  weight_kg: number | null;
  reps_done: number | null;
}

/** Periodos que puede mostrar el mapa muscular. */
export type MusclePeriod = "week" | "lastWeek" | "month";

export const MUSCLE_PERIODS: { id: MusclePeriod; label: string }[] = [
  { id: "week", label: "Esta semana" },
  { id: "lastWeek", label: "Semana pasada" },
  { id: "month", label: "Este mes" },
];

export function musclePeriodLabel(period: MusclePeriod): string {
  return (
    MUSCLE_PERIODS.find((p) => p.id === period)?.label.toLowerCase() ?? ""
  );
}

function musclePeriodRange(period: MusclePeriod): { from: Date; to: Date } {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  if (period === "week") return { from: weekStart, to: now };
  if (period === "lastWeek") {
    const from = new Date(weekStart);
    from.setDate(from.getDate() - 7);
    return { from, to: weekStart };
  }
  return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
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

export interface RecentPoint {
  date: string;
  maxWeight: number;
  maxReps: number;
  sets: number;
}

/**
 * Últimas sesiones con marca por ejercicio (para sugerencia + estancamiento).
 * Una sola query de sesiones + una de logs, agrupado en memoria.
 */
export async function fetchRecentProgression(
  owner: string,
  exerciseIds: string[],
  perExerciseSessions = 4
): Promise<Map<string, RecentPoint[]>> {
  const out = new Map<string, RecentPoint[]>();
  if (exerciseIds.length === 0) return out;

  const { data: sessions, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id, started_at")
    .eq("owner", owner)
    .not("completed_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(30);
  if (sErr) throw sErr;
  const sessionIds = (sessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0) return out;
  const dateBySession = new Map((sessions ?? []).map((s) => [s.id, s.started_at.slice(0, 10)]));

  const { data: logs, error: lErr } = await supabase
    .from("workout_set_logs")
    .select("session_id, exercise_id, weight_kg, reps_done")
    .in("session_id", sessionIds)
    .in("exercise_id", exerciseIds)
    .eq("completed", true);
  if (lErr) throw lErr;

  const byExSession = new Map<string, RecentPoint & { sessionId: string }>();
  for (const log of logs ?? []) {
    const key = `${log.exercise_id}:${log.session_id}`;
    const w = Number(log.weight_kg) || 0;
    const r = Number(log.reps_done) || 0;
    const cur = byExSession.get(key);
    if (!cur) {
      byExSession.set(key, {
        sessionId: log.session_id,
        date: dateBySession.get(log.session_id) ?? "",
        maxWeight: w,
        maxReps: r,
        sets: 1,
      });
    } else {
      cur.maxWeight = Math.max(cur.maxWeight, w);
      cur.maxReps = Math.max(cur.maxReps, r);
      cur.sets += 1;
    }
  }

  const grouped = new Map<string, (RecentPoint & { sessionId: string })[]>();
  for (const [key, p] of byExSession) {
    const eid = key.split(":")[0];
    const list = grouped.get(eid) ?? [];
    list.push(p);
    grouped.set(eid, list);
  }
  for (const [eid, list] of grouped) {
    list.sort((a, b) => a.date.localeCompare(b.date));
    out.set(
      eid,
      list.slice(-perExerciseSessions).map(({ date, maxWeight, maxReps, sets }) => ({
        date,
        maxWeight,
        maxReps,
        sets,
      }))
    );
  }
  return out;
}

/** Sesiones fantasma: empezadas pero nunca terminadas. */
export async function fetchGhostSessions(owner: string): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("owner", owner)
    .is("completed_at", null)
    .order("started_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

/**
 * Borra fantasmas antiguos (por defecto >12h) sin tocar la sesión en curso.
 * Devuelve cuántas borró.
 */
export async function cleanupGhostSessions(
  owner: string,
  excludeSessionId?: string | null,
  olderThanHours = 12
): Promise<number> {
  const ghosts = await fetchGhostSessions(owner);
  const cutoff = Date.now() - olderThanHours * 3600 * 1000;
  const stale = ghosts.filter(
    (g) => g.id !== excludeSessionId && new Date(g.started_at).getTime() < cutoff
  );
  if (stale.length === 0) return 0;
  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .in(
      "id",
      stale.map((s) => s.id)
    );
  if (error) throw error;
  return stale.length;
}
