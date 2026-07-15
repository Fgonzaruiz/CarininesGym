import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Dumbbell, ListChecks, Flame } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { usePlansStore } from "../store/plansStore";
import { fetchHistory } from "../lib/sessionsApi";
import LoadingScreen from "../components/LoadingScreen";
import type { WorkoutSession } from "../types/plan";

const GREETINGS = [
  "Yaaaas queen, hora de entrenar",
  "Vamos reina, dalo todo hoy",
  "Hoy toca brillar",
  "Slay total en 3, 2, 1...",
];

export default function HomePage() {
  const name = useProfileStore((s) => s.name);
  const { plans, loading, fetch } = usePlansStore();
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [greeting] = useState(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);

  useEffect(() => {
    if (name) {
      fetch(name);
      fetchHistory(name, 60).then(setHistory);
    }
  }, [name, fetch]);

  const mainPlan = plans.find((p) => p.is_default) ?? plans[0];

  const nextDay = useMemo(() => {
    if (!mainPlan || mainPlan.days.length === 0) return null;
    const completedForPlan = history.filter(
      (h) => h.plan_id === mainPlan.id && h.completed_at
    ).length;
    return mainPlan.days[completedForPlan % mainPlan.days.length];
  }, [mainPlan, history]);

  const thisWeekCount = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return history.filter(
      (h) => h.completed_at && new Date(h.started_at) >= startOfWeek
    ).length;
  }, [history]);

  if (loading && plans.length === 0) return <LoadingScreen />;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl text-bubble-700">Hola {name}</h1>
        <p className="text-sm text-bubble-400">{greeting}</p>
      </div>

      <div className="kawaii-card p-3 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-glow-400 to-bubble-500 flex items-center justify-center text-white shrink-0">
          <Flame size={20} />
        </div>
        <div>
          <p className="font-heading text-bubble-700">{thisWeekCount} entrenos esta semana</p>
          <p className="text-xs text-bubble-400">sigue así, imparable</p>
        </div>
      </div>

      {mainPlan && nextDay ? (
        <div className="kawaii-card p-5 bg-gradient-to-br from-sky-glow-50 to-bubble-50">
          <p className="text-xs font-heading text-bubble-400 mb-1">Tu próximo día · {mainPlan.name}</p>
          <div className="mb-4">
            <p className="font-heading text-lg text-bubble-700">{nextDay.name}</p>
            <p className="text-xs text-bubble-400">{nextDay.exercises.length} ejercicios</p>
          </div>
          <Link
            to={`/entrenar/${mainPlan.id}/${nextDay.id}`}
            className="btn-kawaii w-full py-3 font-semibold flex items-center justify-center gap-2"
          >
            <Play size={18} /> Empezar entreno
          </Link>
        </div>
      ) : (
        <div className="kawaii-card p-6 text-center">
          <p className="text-bubble-500 font-heading">Crea tu primer plan para empezar</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link to="/planes" className="kawaii-card p-4 flex flex-col items-center gap-1.5 text-center">
          <ListChecks className="text-bubble-500" size={22} />
          <span className="font-heading text-sm text-bubble-600">Mis planes</span>
        </Link>
        <Link to="/ejercicios" className="kawaii-card p-4 flex flex-col items-center gap-1.5 text-center">
          <Dumbbell className="text-bubble-500" size={22} />
          <span className="font-heading text-sm text-bubble-600">Ejercicios</span>
        </Link>
      </div>
    </div>
  );
}
