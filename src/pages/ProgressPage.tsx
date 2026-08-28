import { useEffect, useMemo, useState } from "react";
import { TrendingUp, Trophy, Calendar, Dumbbell, Trash2, Activity } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { CARININES, CARININE_VOICE, isCarinineId } from "../types/profile";
import {
  fetchEvolution,
  fetchStats,
  clearAllProgress,
  fetchExerciseIdsBySessionInRange,
  MUSCLE_PERIODS,
  musclePeriodLabel,
  type MusclePeriod,
  type ExerciseEvolution,
} from "../lib/sessionsApi";
import { useExercises } from "../hooks/useExercises";
import { muscleKeyForTarget, type MuscleKey } from "../lib/muscleMap";
import { clearMewtwoProgress } from "../lib/mewtwoProgress";
import type { Exercise } from "../types/exercise";
import LoadingScreen from "../components/LoadingScreen";
import ExerciseProgressChart from "../components/ExerciseProgressChart";
import MuscleMap, { type MuscleDetailItem } from "../components/MuscleMap";
import ExerciseDetailModal from "../components/ExerciseDetailModal";

export default function ProgressPage() {
  const name = useProfileStore((s) => s.name);
  const injuries = useProfileStore((s) => s.injuries);
  const { exercises } = useExercises();
  const [evolution, setEvolution] = useState<ExerciseEvolution[]>([]);
  const [stats, setStats] = useState<{ thisWeek: number; total: number } | null>(null);
  const [periodExercises, setPeriodExercises] = useState<Map<string, string[]> | null>(null);
  const [period, setPeriod] = useState<MusclePeriod>("week");
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadData() {
    if (!name) return;
    setLoading(true);
    try {
      const [evo, st] = await Promise.all([fetchEvolution(name), fetchStats(name)]);
      setEvolution(evo);
      setStats(st);
      if (evo.length > 0 && !expandedId) setExpandedId(evo[0].exercise_id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  useEffect(() => {
    if (!name) return;
    fetchExerciseIdsBySessionInRange(name, period)
      .then(setPeriodExercises)
      .catch(() => setPeriodExercises(new Map()));
  }, [name, period]);

  /** Sesiones por grupo muscular en el periodo (un músculo cuenta una vez por sesión). */
  const muscleCounts = useMemo(() => {
    if (!periodExercises || exercises.length === 0) return null;
    const exById = new Map(exercises.map((e) => [e.id, e]));
    const counts: Record<string, number> = {};
    for (const exIds of periodExercises.values()) {
      const muscles = new Set<MuscleKey>();
      for (const eid of exIds) {
        const ex = exById.get(eid);
        if (!ex) continue;
        const t = muscleKeyForTarget(ex.target);
        if (t) muscles.add(t);
        for (const sec of ex.secondary_muscles) {
          const s = muscleKeyForTarget(sec);
          if (s) muscles.add(s);
        }
      }
      for (const m of muscles) counts[m] = (counts[m] ?? 0) + 1;
    }
    return counts;
  }, [periodExercises, exercises]);

  /** Ejercicios (con sesiones) que trabajaron cada músculo en el periodo. */
  const muscleDetail = useMemo(() => {
    if (!periodExercises || exercises.length === 0) return {};
    const exById = new Map(exercises.map((e) => [e.id, e]));
    const byMuscle = new Map<MuscleKey, Map<string, { name: string; sessions: number }>>();
    for (const exIds of periodExercises.values()) {
      for (const eid of exIds) {
        const ex = exById.get(eid);
        if (!ex) continue;
        const muscles = new Set<MuscleKey>();
        const t = muscleKeyForTarget(ex.target);
        if (t) muscles.add(t);
        for (const sec of ex.secondary_muscles) {
          const s = muscleKeyForTarget(sec);
          if (s) muscles.add(s);
        }
        for (const m of muscles) {
          let map = byMuscle.get(m);
          if (!map) {
            map = new Map();
            byMuscle.set(m, map);
          }
          const cur = map.get(eid);
          if (cur) cur.sessions += 1;
          else map.set(eid, { name: ex.name, sessions: 1 });
        }
      }
    }
    const detail: Partial<Record<MuscleKey, MuscleDetailItem[]>> = {};
    for (const [m, map] of byMuscle) {
      detail[m] = Array.from(map.entries())
        .map(([eid, x]) => ({ id: eid, name: x.name, sessions: x.sessions }))
        .sort((a, b) => b.sessions - a.sessions);
    }
    return detail;
  }, [periodExercises, exercises]);

  async function handleClearProgress() {
    if (!name) return;
    if (
      !confirm(
        "Borrar todo tu progreso? Se eliminaran todos los entrenos registrados. Esta accion no se puede deshacer."
      )
    ) {
      return;
    }
    setClearing(true);
    try {
      await clearAllProgress(name);
      clearMewtwoProgress(name);
      setEvolution([]);
      setStats({ thisWeek: 0, total: 0 });
      setExpandedId(null);
      setPeriodExercises(new Map());
    } finally {
      setClearing(false);
    }
  }

  if (loading) return <LoadingScreen label="Calculando progreso..." />;

  const profile = name ? CARININES[name] : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-heading uppercase tracking-widest text-meadow-600">
            Tu progreso
          </p>
          <h1 className="font-heading text-2xl game-title">
            {profile?.label ?? name} ·{" "}
            {name && isCarinineId(name) ? CARININE_VOICE[name].progressTitle : "Stats"}
          </h1>
        </div>
        {(evolution.length > 0 || (stats && stats.total > 0)) && (
          <button
            onClick={handleClearProgress}
            disabled={clearing}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-pinky-200 text-pinky-600 text-xs font-heading active:scale-[0.97] disabled:opacity-50"
          >
            <Trash2 size={14} />
            {clearing ? "Borrando..." : "Borrar progreso"}
          </button>
        )}
      </div>

      {muscleCounts && (
        <div className="cozy-card p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2 className="font-heading text-sm text-gray-700 flex items-center gap-1.5">
              <Activity size={16} className="text-meadow-600" /> Mapa muscular
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {MUSCLE_PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`chip border shrink-0 transition active:scale-95 ${
                  period === p.id
                    ? "bg-meadow-100 text-meadow-800 border-meadow-300"
                    : "bg-white text-gray-400 border-wood-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <MuscleMap
            counts={muscleCounts}
            periodLabel="Sesiones"
            summaryLabel={musclePeriodLabel(period)}
            muscleDetail={muscleDetail}
            catalog={exercises}
            injuries={injuries}
            onViewExercise={(id) => {
              const ex = exercises.find((e) => e.id === id);
              if (ex) setDetailExercise(ex);
            }}
          />
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="cozy-card p-4 flex flex-col gap-1">
            <Calendar size={18} className="text-meadow-500" />
            <p className="font-heading text-2xl text-gray-800">{stats.thisWeek}</p>
            <p className="text-xs text-gray-500">Esta semana</p>
          </div>
          <div className="cozy-card p-4 flex flex-col gap-1">
            <Trophy size={18} className="text-wood-500" />
            <p className="font-heading text-2xl text-gray-800">{stats.total}</p>
            <p className="text-xs text-gray-500">Entrenos totales</p>
          </div>
        </div>
      )}

      {evolution.length === 0 ? (
        <div className="cozy-card p-10 text-center">
          <TrendingUp size={40} className="mx-auto text-wood-300 mb-3" />
          <p className="font-heading text-gray-600">Aun no hay datos de progreso</p>
          <p className="text-sm text-gray-400 mt-1">
            Completa un entreno registrando reps y peso en cada serie
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-sm text-gray-600 flex items-center gap-1.5">
            <Dumbbell size={16} /> Progreso por ejercicio
          </h2>
          {evolution.map((ex) => {
            const isOpen = expandedId === ex.exercise_id;
            const last = ex.history[ex.history.length - 1];
            return (
              <div key={ex.exercise_id} className="cozy-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : ex.exercise_id)}
                  className="w-full p-4 text-left active:bg-wood-50/50 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-heading text-gray-800 capitalize truncate">
                        {ex.exercise_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {ex.sessions} sesiones · volumen total {Math.round(ex.total_volume)} kg
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {ex.best_weight > 0 && (
                        <p className="text-sm font-heading text-psychic-600">{ex.best_weight} kg PR</p>
                      )}
                      {ex.best_reps > 0 && (
                        <p className="text-xs text-meadow-600">{ex.best_reps} reps max</p>
                      )}
                    </div>
                  </div>
                  {!isOpen && last && (
                    <p className="text-[11px] text-gray-400 mt-2">
                      Ultima sesion ({last.date.slice(5).replace("-", "/")}):{" "}
                      {last.weight > 0 ? `${last.weight} kg` : ""}
                      {last.weight > 0 && last.reps > 0 ? " · " : ""}
                      {last.reps > 0 ? `${last.reps} reps` : ""}
                      <span className="text-meadow-600 ml-1">· Ver graficas</span>
                    </p>
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-wood-100 pt-3">
                    <div className="grid grid-cols-3 gap-2 mb-2 text-center">
                      <div className="rounded-lg bg-white/80 py-2 px-1">
                        <p className="text-[10px] text-gray-400">Sesiones</p>
                        <p className="font-heading text-gray-800">{ex.sessions}</p>
                      </div>
                      <div className="rounded-lg bg-white/80 py-2 px-1">
                        <p className="text-[10px] text-gray-400">PR peso</p>
                        <p className="font-heading text-psychic-600">
                          {ex.best_weight > 0 ? `${ex.best_weight} kg` : "—"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/80 py-2 px-1">
                        <p className="text-[10px] text-gray-400">PR reps</p>
                        <p className="font-heading text-meadow-600">
                          {ex.best_reps > 0 ? ex.best_reps : "—"}
                        </p>
                      </div>
                    </div>
                    <ExerciseProgressChart history={ex.history} chartId={ex.exercise_id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ExerciseDetailModal
        exercise={detailExercise}
        open={!!detailExercise}
        onClose={() => setDetailExercise(null)}
        exercises={exercises}
        injuries={injuries}
      />
    </div>
  );
}
