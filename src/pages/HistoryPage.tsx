import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle2, Clock } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { fetchHistory } from "../lib/sessionsApi";
import type { WorkoutSession } from "../types/plan";
import LoadingScreen from "../components/LoadingScreen";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export default function HistoryPage() {
  const name = useProfileStore((s) => s.name);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    fetchHistory(name)
      .then(setSessions)
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) return <LoadingScreen label="Buscando tu historial..." />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl text-bubble-700">Historial</h1>
        <p className="text-sm text-bubble-400">Cada entreno cuenta, reina</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {sessions.map((s) => (
          <div key={s.id} className="kawaii-card p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-bubble-50 flex items-center justify-center shrink-0">
              {s.completed_at ? (
                <CheckCircle2 size={20} className="text-bubble-500" />
              ) : (
                <Clock size={20} className="text-pinky-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading text-bubble-700 truncate">{s.day_name || "Entreno"}</p>
              <p className="text-xs text-bubble-400">
                {formatDate(s.started_at)} · {formatTime(s.started_at)}
              </p>
            </div>
            {!s.completed_at && (
              <span className="chip bg-pinky-100 text-pinky-500 shrink-0">sin terminar</span>
            )}
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="kawaii-card p-10 text-center">
            <CalendarCheck size={40} className="mx-auto text-bubble-300 mb-2" />
            <p className="text-bubble-500 font-heading">Aún no hay entrenos aquí</p>
            <p className="text-sm text-bubble-400 mt-1">Ve a tus planes y a darlo todo</p>
          </div>
        )}
      </div>
    </div>
  );
}
