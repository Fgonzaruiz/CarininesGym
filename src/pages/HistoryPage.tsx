import { useEffect, useState } from "react";
import { CalendarCheck, Clock, Dumbbell, Flame, Zap, HeartPulse } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { fetchHistory } from "../lib/sessionsApi";
import { SESSION_TYPE_INFO, formatDuration } from "../lib/sessionTypes";
import type { SessionType, WorkoutSession } from "../types/plan";
import LoadingScreen from "../components/LoadingScreen";

const TYPE_ICONS: Record<SessionType, typeof Dumbbell> = {
  fuerza: Dumbbell,
  tabata: Flame,
  hybrid: Zap,
  cardio: HeartPulse,
};

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
        {sessions.map((s) => {
          const type = s.session_type ?? "fuerza";
          const typeInfo = SESSION_TYPE_INFO[type] ?? SESSION_TYPE_INFO.fuerza;
          const TypeIcon = TYPE_ICONS[type] ?? Dumbbell;
          const duration = formatDuration(s.duration_minutes);
          return (
            <div key={s.id} className="kawaii-card p-4 flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl ${typeInfo.iconClass} flex items-center justify-center text-white shrink-0`}
              >
                {s.completed_at ? (
                  <TypeIcon size={20} />
                ) : (
                  <Clock size={20} className="text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading text-bubble-700 truncate">
                  {s.day_name || "Entreno"}
                </p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className={`chip ${typeInfo.chipClass}`}>{typeInfo.label}</span>
                  {duration && (
                    <span className="chip bg-bubble-50 text-bubble-500">{duration}</span>
                  )}
                  {s.notes && (
                    <span className="text-[10px] text-bubble-400 truncate max-w-full">
                      {s.notes}
                    </span>
                  )}
                </div>
                <p className="text-xs text-bubble-400 mt-1">
                  {formatDate(s.started_at)} · {formatTime(s.started_at)}
                </p>
              </div>
              {!s.completed_at && (
                <span className="chip bg-pinky-100 text-pinky-500 shrink-0">sin terminar</span>
              )}
            </div>
          );
        })}

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
