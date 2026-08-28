export interface PlanExercise {
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

export interface PlanDay {
  id: string;
  plan_id: string;
  day_index: number;
  name: string;
  exercises: PlanExercise[];
}

export interface Plan {
  id: string;
  owner: string;
  name: string;
  description: string;
  is_default: boolean;
  created_at: string;
  days: PlanDay[];
}

export interface SetLog {
  id: string;
  session_id: string;
  plan_exercise_id: string;
  exercise_id?: string;
  exercise_name?: string;
  set_index: number;
  reps_done: number | null;
  weight_kg: number | null;
  completed: boolean;
  created_at?: string;
}

export type SessionType = "fuerza" | "tabata" | "hybrid" | "cardio";

export const SESSION_TYPES: SessionType[] = ["fuerza", "tabata", "hybrid", "cardio"];

export interface WorkoutSession {
  id: string;
  owner: string;
  plan_day_id: string | null;
  plan_id: string | null;
  day_name: string;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  session_type: SessionType;
  duration_minutes: number | null;
}
