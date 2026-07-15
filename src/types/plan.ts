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
  set_index: number;
  reps_done: number | null;
  weight_kg: number | null;
  completed: boolean;
}

export interface WorkoutSession {
  id: string;
  owner: string;
  plan_day_id: string;
  plan_id: string;
  day_name: string;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
}
