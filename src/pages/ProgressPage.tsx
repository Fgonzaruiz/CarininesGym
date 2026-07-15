import { useEffect, useState } from "react";
import { TrendingUp, Trophy, Calendar, Dumbbell } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { CARININES } from "../types/profile";
import { fetchEvolution, fetchStats, type ExerciseEvolution } from "../lib/sessionsApi";
import LoadingScreen from "../components/LoadingScreen";

export default function ProgressPage() {
  const name = useProfileStore((s) => s.name);
  const [evolution, setEvolution] = useState<ExerciseEvolution[]>([]);
  const [stats, setStats] = useState<{ thisWeek: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    Promise.all([fetchEvolution(name), fetchStats(name)])
      .then(([evo, st]) => {
        setEvolution(evo);
        setStats(st);
      })
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) return <LoadingScreen label="Calculando evolucion..." />;

  const profile = name ? CARININES[name] : null;
  const maxVolume = evolution[0]?.total_volume ?? 1;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-heading uppercase tracking-widest text-meadow-600">
          Tu evolucion
        </p>
        <h1 className="font-heading text-2xl game-title">
          {profile?.label ?? name} · Pokedex de gains
        </h1>
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
          <p className="font-heading text-gray-600">Aun no hay datos de evolucion</p>
          <p className="text-sm text-gray-400 mt-1">
            Completa un entreno registrando reps y peso en cada serie
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-sm text-gray-600 flex items-center gap-1.5">
            <Dumbbell size={16} /> Progreso por ejercicio
          </h2>
          {evolution.map((ex) => (
            <div key={ex.exercise_id} className="cozy-card p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="font-heading text-gray-800 capitalize truncate">{ex.exercise_name}</p>
                  <p className="text-xs text-gray-500">{ex.sessions} sesiones registradas</p>
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

              <div className="progress-bar-game mb-2">
                <div style={{ width: `${Math.min(100, (ex.total_volume / maxVolume) * 100)}%` }} />
              </div>

              {ex.history.length > 1 && (
                <div className="flex items-end gap-1 h-12 mt-2">
                  {ex.history.slice(-8).map((h, i) => {
                    const hMax = Math.max(...ex.history.slice(-8).map((x) => x.weight || x.reps), 1);
                    const val = h.weight || h.reps;
                    const barH = Math.max(8, (val / hMax) * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-psychic-400 to-meadow-400 min-h-[4px]"
                          style={{ height: `${barH}%` }}
                        />
                        <span className="text-[8px] text-gray-400 truncate w-full text-center">
                          {h.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
