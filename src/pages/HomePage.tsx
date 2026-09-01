import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Dumbbell,
  ListChecks,
  Flame,
  TrendingUp,
  Zap,
  Apple,
} from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { usePlansStore } from "../store/plansStore";
import { CARININES, CARININE_VOICE, pickRandom } from "../types/profile";
import { fetchHistory, fetchStats } from "../lib/sessionsApi";
import {
  getNextMewtwoDay,
  isMewtwoMonthPlan,
  loadMewtwoProgress,
  getWeekMeta,
} from "../lib/mewtwoProgress";
import LoadingScreen from "../components/LoadingScreen";
import QuickLogModal from "../components/QuickLogModal";
import { PROTEIN_GOAL } from "../data/nutrition";
import type { WorkoutSession } from "../types/plan";

export default function HomePage() {
  const name = useProfileStore((s) => s.name);
  const profile = name ? CARININES[name] : null;
  const { plans, loading, fetch } = usePlansStore();
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [stats, setStats] = useState<{ thisWeek: number; total: number } | null>(null);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [greeting] = useState(
    name ? pickRandom(CARININE_VOICE[name].greetings) : ""
  );

  useEffect(() => {
    if (name) {
      fetch(name);
      fetchHistory(name, 60).then(setHistory);
      fetchStats(name).then(setStats);
    }
  }, [name, fetch]);

  function handleQuickLogSaved() {
    if (!name) return;
    fetchHistory(name, 60).then(setHistory);
    fetchStats(name).then(setStats);
  }

  const streak = useMemo(() => {
    const dates = new Set<string>();
    for (const s of history) {
      if (!s.completed_at) continue;
      const d = new Date(s.completed_at);
      dates.add(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`
      );
    }
    const today = new Date();
    const key = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    let cursor = new Date(today);
    if (!dates.has(key(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
      if (!dates.has(key(cursor))) return 0;
    }
    let count = 0;
    while (dates.has(key(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [history]);

  const mainPlan = plans.find((p) => p.is_default) ?? plans[0];

  const nextWorkout = useMemo(() => {
    if (!mainPlan || mainPlan.days.length === 0) return null;

    if (isMewtwoMonthPlan(mainPlan) && name) {
      const mewtwo = getNextMewtwoDay(mainPlan, name, history);
      if (mewtwo) {
        return {
          day: mewtwo.day,
          weekLabel: mewtwo.weekTitle,
          weekProgress: `${mewtwo.completedInWeek}/${mewtwo.totalInWeek} esta semana`,
        };
      }
    }

    const completedForPlan = history.filter(
      (h) => h.plan_id === mainPlan.id && h.completed_at
    ).length;
    const day = mainPlan.days[completedForPlan % mainPlan.days.length];
    return { day, weekLabel: null, weekProgress: null };
  }, [mainPlan, history, name]);

  const mewtwoWeek = useMemo(() => {
    if (!name || !mainPlan || !isMewtwoMonthPlan(mainPlan)) return null;
    const progress = loadMewtwoProgress(name);
    return getWeekMeta(progress.week);
  }, [name, mainPlan, history]);

  if (loading && plans.length === 0) return <LoadingScreen />;

  const isKnifey = name === "Knifey";

  return (
    <div className="flex flex-col gap-5">
      <div className={`cozy-card p-5 ${isKnifey ? "knifey-card" : "forky-card"}`}>
        <h1 className="font-heading text-2xl text-gray-800">
          Hola, {profile?.label}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{greeting}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="cozy-card p-3 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-wood-300 to-wood-500 flex items-center justify-center text-white shrink-0">
              <Flame size={16} />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-gray-800 truncate">{stats.thisWeek} esta sem.</p>
              <p className="text-[11px] text-gray-500">{stats.total} totales</p>
            </div>
          </div>
          <div className="cozy-card p-3 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pinky-400 to-pinky-600 flex items-center justify-center text-white shrink-0">
              <Zap size={16} />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-gray-800 truncate">{streak} días de racha</p>
              <p className="text-[11px] text-gray-500">sin parar</p>
            </div>
          </div>
          <Link to="/progreso" className="cozy-card p-3 flex items-center gap-2.5 active:scale-[0.98]">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-psychic-300 to-psychic-500 flex items-center justify-center text-white shrink-0">
              <TrendingUp size={16} />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-gray-800">Progreso</p>
              <p className="text-[11px] text-gray-500">Ver progreso</p>
            </div>
          </Link>
        </div>
      )}

      {mewtwoWeek && (
        <div className="cozy-card p-4 knifey-card">
          <p className="text-xs font-heading uppercase tracking-widest text-gray-500">
            Fase Mewtwo · Semana {mewtwoWeek.week} de 4
          </p>
          <p className="font-heading text-gray-800 mt-1">{mewtwoWeek.title}</p>
          <p className="text-xs text-gray-500 mt-1">{mewtwoWeek.subtitle}</p>
        </div>
      )}

      {mainPlan && nextWorkout ? (
        <div className={`cozy-card p-5 ${isKnifey ? "knifey-card" : ""}`}>
          <p className="text-xs font-heading text-gray-500 mb-1">
            Proximo dia · {mainPlan.name}
            {nextWorkout.weekLabel ? ` · ${nextWorkout.weekLabel}` : ""}
          </p>
          <p className="font-heading text-lg text-gray-800">{nextWorkout.day.name}</p>
          <p className="text-xs text-gray-500 mb-4">
            {nextWorkout.day.exercises.length} ejercicios
            {nextWorkout.weekProgress ? ` · ${nextWorkout.weekProgress}` : ""}
          </p>
          <Link
            to={`/entrenar/${mainPlan.id}/${nextWorkout.day.id}`}
            className={`w-full py-3 font-semibold flex items-center justify-center gap-2 rounded-full text-white ${isKnifey ? "btn-psychic game-btn" : "game-btn"}`}
          >
            <Play size={18} /> Empezar entreno
          </Link>
        </div>
      ) : (
        <div className="cozy-card p-6 text-center">
          <p className="font-heading text-wood-600">
            Los entrenos apareceran aqui en cuanto tengas un plan listo
          </p>
          <Link to="/planes" className="game-btn inline-block mt-3 px-6 py-2 text-sm">
            Ir a planes
          </Link>
        </div>
      )}

      <button
        onClick={() => setQuickLogOpen(true)}
        className={`cozy-card p-4 flex items-center gap-3 text-left active:scale-[0.98] transition ${isKnifey ? "knifey-card" : ""}`}
      >
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pinky-400 to-pinky-600 flex items-center justify-center text-white shrink-0">
          <Zap size={20} />
        </div>
        <div className="flex-1">
          <p className="font-heading text-gray-800">Día libre o algo especial</p>
          <p className="text-[11px] text-gray-500">
            Registra Tabata, Hybrid o cardio en un momento
          </p>
        </div>
      </button>

      <Link
        to="/nutricion"
        className={`cozy-card p-4 flex items-center gap-3 active:scale-[0.98] transition ${isKnifey ? "knifey-card" : ""}`}
      >
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-meadow-300 to-meadow-600 flex items-center justify-center text-white shrink-0">
          <Apple size={20} />
        </div>
        <div className="flex-1">
          <p className="font-heading text-gray-800">Tu guía de nutrición</p>
          <p className="text-[11px] text-gray-500">
            Regla 80-20 · proteína {PROTEIN_GOAL} · qué evitar
          </p>
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/planes" className="cozy-card p-4 flex flex-col items-center gap-1.5 text-center">
          <ListChecks className="text-meadow-600" size={22} />
          <span className="font-heading text-sm text-gray-700">Mis planes</span>
        </Link>
        <Link to="/ejercicios" className="cozy-card p-4 flex flex-col items-center gap-1.5 text-center">
          <Dumbbell className="text-psychic-600" size={22} />
          <span className="font-heading text-sm text-gray-700">Ejercicios</span>
        </Link>
      </div>

      <QuickLogModal
        open={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        onSaved={handleQuickLogSaved}
      />
    </div>
  );
}
