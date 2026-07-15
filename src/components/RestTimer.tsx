import { useEffect, useState } from "react";
import { Timer, Pause, Play } from "lucide-react";

interface RestTimerProps {
  seconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

export default function RestTimer({ seconds, onComplete, autoStart = false }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(autoStart);

  useEffect(() => {
    setRemaining(seconds);
    setRunning(autoStart);
  }, [seconds, autoStart]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          onComplete?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, remaining, onComplete]);

  const pct = seconds > 0 ? ((seconds - remaining) / seconds) * 100 : 100;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="rounded-2xl bg-sky-50 border-2 border-sky-200 p-3 mt-2">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-sky-600">
          <Timer size={14} />
          <span className="text-xs font-heading">Descanso</span>
        </div>
        <span className="font-heading text-lg text-sky-700 tabular-nums">
          {mins}:{secs.toString().padStart(2, "0")}
        </span>
        <button
          onClick={() => setRunning((r) => !r)}
          className="p-1.5 rounded-full bg-white border border-sky-200 text-sky-600"
          aria-label={running ? "Pausar" : "Iniciar"}
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>
      <div className="progress-bar-game">
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
