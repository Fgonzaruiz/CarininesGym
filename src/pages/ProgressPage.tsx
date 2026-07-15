import { useEffect, useState } from "react";
import { TrendingUp, Trophy, Calendar, Dumbbell, Trash2 } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { CARININES, CARININE_VOICE, isCarinineId } from "../types/profile";
import {
  fetchEvolution,
  fetchStats,
  clearAllProgress,
  type ExerciseEvolution,
} from "../lib/sessionsApi";
import { clearMewtwoProgress } from "../lib/mewtwoProgress";
import LoadingScreen from "../components/LoadingScreen";
import ExerciseProgressChart from "../components/ExerciseProgressChart";

export default function ProgressPage() {
  const name = useProfileStore((s) => s.name);
  const [evolution, setEvolution] = useState<ExerciseEvolution[]>([]);
  const [stats, setStats] = useState<{ thisWeek: number; total: number } | null>(null);
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
    </div>
  );
}
