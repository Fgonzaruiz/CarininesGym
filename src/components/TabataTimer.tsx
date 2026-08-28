import { useEffect, useState } from "react";
import { Play, Pause, SkipForward, Flame } from "lucide-react";

interface TabataTimerProps {
  rounds: number;
  workSeconds: number;
  restSeconds: number;
  onComplete: (totalSeconds: number) => void;
}

type Phase = "idle" | "work" | "rest" | "done";

export default function TabataTimer({
  rounds,
  workSeconds,
  restSeconds,
  onComplete,
}: TabataTimerProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(1);
  const [remaining, setRemaining] = useState(workSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (phase === "idle" || phase === "done") return;
    if (!running) return;

    const t = setInterval(() => {
      setRemaining((r) => {
        if (r > 1) return r - 1;
        // Cambio de fase
        if (phase === "work") {
          if (round >= rounds) {
            setPhase("done");
            setRunning(false);
            onComplete(rounds * (workSeconds + restSeconds));
            return 0;
          }
          setPhase("rest");
          return restSeconds;
        }
        setPhase("work");
        setRound((rnd) => rnd + 1);
        return workSeconds;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, running, round, rounds, workSeconds, restSeconds, onComplete]);

  function start() {
    setPhase("work");
    setRemaining(workSeconds);
    setRound(1);
    setRunning(true);
  }

  function skip() {
    if (phase === "work") {
      setPhase("rest");
      setRemaining(restSeconds);
    } else {
      setPhase("work");
      setRemaining(workSeconds);
      setRound((r) => Math.min(r + 1, rounds));
    }
  }

  const isWorking = phase === "work";
  const pct =
    phase === "work"
      ? (remaining / workSeconds) * 100
      : phase === "rest"
        ? (remaining / restSeconds) * 100
        : 100;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  if (phase === "done") {
    return (
      <div className="rounded-2xl bg-meadow-50 border-2 border-meadow-300 p-4 text-center">
        <p className="font-heading text-meadow-700">¡Tabata completado! Slay. 💪</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border-2 p-4 transition-colors ${
        isWorking
          ? "bg-pinky-50 border-pinky-300"
          : phase === "rest"
            ? "bg-sky-50 border-sky-300"
            : "bg-bubble-50 border-bubble-200"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={`flex items-center gap-1 font-heading text-xs ${
            isWorking ? "text-pinky-600" : "text-sky-600"
          }`}
        >
          <Flame size={13} />
          {isWorking ? "¡A TOPE!" : phase === "rest" ? "Descanso" : "Listo para empezar"}
        </span>
        <span className="text-xs font-heading text-bubble-400">
          Ronda {Math.min(round, rounds)}/{rounds}
        </span>
      </div>

      <p className="font-heading text-4xl text-center tabular-nums my-3 text-gray-800">
        {mins}:{secs.toString().padStart(2, "0")}
      </p>

      <div className="progress-bar-game mb-3">
        <div style={{ width: `${pct}%` }} />
      </div>

      <div className="flex gap-2 justify-center">
        {phase === "idle" ? (
          <button
            onClick={start}
            className="game-btn px-5 py-2 text-sm flex items-center gap-1.5"
          >
            <Play size={15} /> Empezar Tabata
          </button>
        ) : (
          <>
            <button
              onClick={() => setRunning((r) => !r)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border-2 border-bubble-200 text-bubble-600 font-heading text-sm"
            >
              {running ? <Pause size={15} /> : <Play size={15} />}
              {running ? "Pausar" : "Seguir"}
            </button>
            <button
              onClick={skip}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border-2 border-wood-200 text-wood-600 font-heading text-sm"
            >
              <SkipForward size={15} /> Saltar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
