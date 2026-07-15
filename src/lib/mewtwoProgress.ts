import {
  FASE_MEWTWO_PLAN,
  MEWTWO_DAYS_PER_WEEK,
  MEWTWO_WEEKS,
} from "../data/defaultPlan";
import type { Plan, PlanDay, WorkoutSession } from "../types/plan";

export interface MewtwoProgress {
  week: number;
  weekStartedAt: string;
}

const STORAGE_PREFIX = "carininesgym_mewtwo_progress";

function storageKey(owner: string): string {
  return `${STORAGE_PREFIX}_${owner}`;
}

export function isMewtwoPlan(plan: { name: string }): boolean {
  return plan.name === FASE_MEWTWO_PLAN.name;
}

export function isMewtwoMonthPlan(plan: Plan): boolean {
  return isMewtwoPlan(plan) && plan.days.length >= MEWTWO_DAYS_PER_WEEK * MEWTWO_WEEKS;
}

export function getWeekMeta(week: number) {
  return FASE_MEWTWO_PLAN.weeks[Math.min(Math.max(week, 1), MEWTWO_WEEKS) - 1];
}

export function loadMewtwoProgress(owner: string): MewtwoProgress {
  try {
    const raw = localStorage.getItem(storageKey(owner));
    if (raw) {
      const parsed = JSON.parse(raw) as MewtwoProgress;
      if (parsed.week >= 1 && parsed.week <= MEWTWO_WEEKS) return parsed;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { week: 1, weekStartedAt: new Date(0).toISOString() };
}

export function saveMewtwoProgress(owner: string, progress: MewtwoProgress): void {
  localStorage.setItem(storageKey(owner), JSON.stringify(progress));
}

export function clearMewtwoProgress(owner: string): void {
  localStorage.removeItem(storageKey(owner));
}

export function getWeekDays(plan: Plan, week: number): PlanDay[] {
  const start = (week - 1) * MEWTWO_DAYS_PER_WEEK;
  const end = start + MEWTWO_DAYS_PER_WEEK;
  return plan.days
    .filter((d) => d.day_index >= start && d.day_index < end)
    .sort((a, b) => a.day_index - b.day_index);
}

export function getCompletedDayIdsInWeek(
  plan: Plan,
  week: number,
  history: WorkoutSession[],
  weekStartedAt: string
): Set<string> {
  const weekDayIds = new Set(getWeekDays(plan, week).map((d) => d.id));
  const completed = new Set<string>();
  for (const session of history) {
    if (
      session.plan_id === plan.id &&
      session.completed_at &&
      weekDayIds.has(session.plan_day_id) &&
      session.completed_at >= weekStartedAt
    ) {
      completed.add(session.plan_day_id);
    }
  }
  return completed;
}

export function getNextMewtwoDay(
  plan: Plan,
  owner: string,
  history: WorkoutSession[]
): {
  day: PlanDay;
  week: number;
  weekTitle: string;
  completedInWeek: number;
  totalInWeek: number;
} | null {
  const progress = loadMewtwoProgress(owner);
  const weekDays = getWeekDays(plan, progress.week);
  if (weekDays.length === 0) return null;

  const completed = getCompletedDayIdsInWeek(
    plan,
    progress.week,
    history,
    progress.weekStartedAt
  );
  const nextDay = weekDays.find((d) => !completed.has(d.id)) ?? weekDays[0];
  const meta = getWeekMeta(progress.week);

  return {
    day: nextDay,
    week: progress.week,
    weekTitle: meta.title,
    completedInWeek: completed.size,
    totalInWeek: weekDays.length,
  };
}

/** Tras completar un entreno, avanza de semana si toca. */
export function onMewtwoSessionComplete(
  owner: string,
  plan: Plan,
  history: WorkoutSession[]
): MewtwoProgress {
  const progress = loadMewtwoProgress(owner);
  const weekDays = getWeekDays(plan, progress.week);
  const completed = getCompletedDayIdsInWeek(
    plan,
    progress.week,
    history,
    progress.weekStartedAt
  );

  if (completed.size < weekDays.length) return progress;

  const next: MewtwoProgress =
    progress.week < MEWTWO_WEEKS
      ? { week: progress.week + 1, weekStartedAt: new Date().toISOString() }
      : { week: 1, weekStartedAt: new Date().toISOString() };

  saveMewtwoProgress(owner, next);
  return next;
}
