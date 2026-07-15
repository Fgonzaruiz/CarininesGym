import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Repeat, CheckCircle2, X } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { usePlansStore } from "../store/plansStore";
import { useExercises } from "../hooks/useExercises";
import { findSimilarExercises } from "../lib/exercises";
import * as sessionsApi from "../lib/sessionsApi";
import * as plansApi from "../lib/plansApi";
import type { PlanExercise } from "../types/plan";
import LoadingScreen from "../components/LoadingScreen";
import ExercisePickerModal from "../components/ExercisePickerModal";

interface SetState {
  completed: boolean;
  reps: string;
  weight: string;
  logId?: string;
}

const HYPE_MESSAGES = [
  "Lo lograste, reina",
  "Yaaaas queen, entreno completado",
  "Esas piernotas ya son leyenda",
  "Slay total, nivel diosa alcanzado",
];

export default function WorkoutSessionPage() {
  const { planId, dayId } = useParams<{ planId: string; dayId: string }>();
  const navigate = useNavigate();
  const name = useProfileStore((s) => s.name);
  const { plans, fetch, refresh } = usePlansStore();
  const { exercises, loading: exLoading } = useExercises();

  const plan = plans.find((p) => p.id === planId);
  const day = plan?.days.find((d) => d.id === dayId);

  useEffect(() => {
    if (name) fetch(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sets, setSets] = useState<Record<string, SetState[]>>({});
  const [substituting, setSubstituting] = useState<PlanExercise | null>(null);
  const [finished, setFinished] = useState(false);
  const [hypeMessage] = useState(
    HYPE_MESSAGES[Math.floor(Math.random() * HYPE_MESSAGES.length)]
  );

  useEffect(() => {
    if (!name || !plan || !day || sessionId) return;
    sessionsApi.startSession(name, plan.id, day.id, day.name).then((s) => {
      setSessionId(s.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, plan, day]);

  useEffect(() => {
    if (!day) return;
    setSets((prev) => {
      const next = { ...prev };
      for (const pe of day.exercises) {
        if (!next[pe.id]) {
          next[pe.id] = Array.from({ length: pe.sets }, () => ({
            completed: false,
            reps: "",
            weight: "",
          }));
        }
      }
      return next;
    });
  }, [day]);

  const exerciseMap = useMemo(() => {
    const map = new Map(exercises.map((e) => [e.id, e]));
    return map;
  }, [exercises]);

  if (!name || exLoading || !plan) return <LoadingScreen label="Preparando tu entreno..." />;
  if (!day) {
    return (
      <div className="text-center py-16">
        <p className="text-bubble-500">No encontré ese día</p>
      </div>
    );
  }

  async function toggleSet(peId: string, idx: number, exercise_id: string, exercise_name: string) {
    if (!sessionId) return;
    const current = sets[peId][idx];
    const completed = !current.completed;
    setSets((prev) => ({
      ...prev,
      [peId]: prev[peId].map((s, i) => (i === idx ? { ...s, completed } : s)),
    }));
    const log = await sessionsApi.upsertSetLog({
      session_id: sessionId,
      plan_exercise_id: peId,
      exercise_id,
      exercise_name,
      set_index: idx,
      reps_done: current.reps ? Number(current.reps) : null,
      weight_kg: current.weight ? Number(current.weight) : null,
      completed,
      existingId: current.logId,
    });
    setSets((prev) => ({
      ...prev,
      [peId]: prev[peId].map((s, i) => (i === idx ? { ...s, logId: log.id } : s)),
    }));
  }

  function updateField(peId: string, idx: number, field: "reps" | "weight", value: string) {
    setSets((prev) => ({
      ...prev,
      [peId]: prev[peId].map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  }

  async function handleFinish() {
    if (sessionId) await sessionsApi.completeSession(sessionId);
    setFinished(true);
  }

  async function handleSubstitute(newExerciseId: string) {
    if (!substituting) return;
    await plansApi.substituteExercise(
      substituting.id,
      substituting.exercise_id,
      newExerciseId,
      substituting.original_exercise_id
    );
    await refresh(name!);
    setSubstituting(null);
  }

  const substituteSuggestions = substituting
    ? (() => {
        const current = exerciseMap.get(substituting.exercise_id);
        return current ? findSimilarExercises(exercises, current) : [];
      })()
    : [];

  const totalSets = day.exercises.reduce((acc, pe) => acc + pe.sets, 0);
  const doneSets = day.exercises.reduce(
    (acc, pe) => acc + (sets[pe.id]?.filter((s) => s.completed).length ?? 0),
    0
  );

  if (finished) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center gap-4 px-6">
        <CheckCircle2 size={64} className="text-bubble-500" />
        <h1 className="font-heading text-2xl text-bubble-700">{hypeMessage}</h1>
        <p className="text-bubble-400">Entreno de "{day.name}" guardado en tu historial</p>
        <button
          onClick={() => navigate(`/planes/${plan.id}`)}
          className="btn-kawaii px-6 py-3 font-semibold mt-2"
        >
          Volver al plan
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-10 flex flex-col gap-4 min-h-screen">
      <button
        onClick={() => navigate(`/planes/${plan.id}`)}
        className="flex items-center gap-1 text-sm text-bubble-400 font-heading self-start"
      >
        <X size={16} /> Salir
      </button>

      <div className="kawaii-card p-4 sticky top-4 z-20">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <p className="font-heading text-lg text-bubble-700">{day.name}</p>
            <div className="h-2 rounded-full bg-bubble-100 mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-glow-400 to-bubble-500 transition-all"
                style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-heading text-bubble-500 shrink-0">
            {doneSets}/{totalSets}
          </span>
        </div>
      </div>

      {day.exercises.map((pe) => {
        const ex = exerciseMap.get(pe.exercise_id);
        if (!ex) return null;
        const exSets = sets[pe.id] ?? [];
        return (
          <div key={pe.id} className="kawaii-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={`${import.meta.env.BASE_URL}${ex.image ?? ""}`}
                alt={ex.name}
                loading="lazy"
                className="w-14 h-14 rounded-2xl object-cover bg-bubble-50"
              />
              <div className="flex-1 min-w-0">
                <p className="font-heading text-bubble-700 capitalize truncate">{ex.name}</p>
                <p className="text-xs text-bubble-400">
                  {pe.sets} x {pe.reps} · descanso {pe.rest_seconds}s
                </p>
                {pe.notes && <p className="text-[11px] text-pinky-500">{pe.notes}</p>}
              </div>
              <button
                onClick={() => setSubstituting(pe)}
                className="p-2 rounded-full bg-sky-glow-50 text-sky-glow-500 shrink-0"
                aria-label="Me duele, cambiar ejercicio"
                title="Me duele, sustituir"
              >
                <Repeat size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {exSets.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-bubble-50/70 rounded-2xl p-2">
                  <button
                    onClick={() => toggleSet(pe.id, idx, pe.exercise_id, ex.name)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition ${
                      s.completed
                        ? "bg-bubble-500 text-white"
                        : "bg-white border-2 border-bubble-200 text-transparent"
                    }`}
                  >
                    <Check size={16} />
                  </button>
                  <span className="text-xs text-bubble-400 w-14 shrink-0">Serie {idx + 1}</span>
                  <input
                    value={s.reps}
                    onChange={(e) => updateField(pe.id, idx, "reps", e.target.value)}
                    placeholder="reps"
                    inputMode="numeric"
                    className="w-16 rounded-xl border border-bubble-200 px-2 py-1.5 text-sm text-center outline-none focus:border-bubble-400 bg-white"
                  />
                  <input
                    value={s.weight}
                    onChange={(e) => updateField(pe.id, idx, "weight", e.target.value)}
                    placeholder="kg"
                    inputMode="decimal"
                    className="w-16 rounded-xl border border-bubble-200 px-2 py-1.5 text-sm text-center outline-none focus:border-bubble-400 bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <button onClick={handleFinish} className="btn-kawaii py-4 font-semibold text-lg mb-4">
        Terminar entreno
      </button>

      <ExercisePickerModal
        open={!!substituting}
        onClose={() => setSubstituting(null)}
        exercises={exercises}
        onPick={(ex) => handleSubstitute(ex.id)}
        title="Me duele, cambiar por..."
        suggested={substituteSuggestions}
      />
    </div>
  );
}
