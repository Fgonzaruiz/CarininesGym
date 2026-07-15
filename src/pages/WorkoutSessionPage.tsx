import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Check, Repeat, CheckCircle2, X, Plus, TrendingUp } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { usePlansStore } from "../store/plansStore";
import { useExercises } from "../hooks/useExercises";
import { findSimilarExercises } from "../lib/exercises";
import * as sessionsApi from "../lib/sessionsApi";
import * as plansApi from "../lib/plansApi";
import type { PlanExercise } from "../types/plan";
import LoadingScreen from "../components/LoadingScreen";
import ExercisePickerModal from "../components/ExercisePickerModal";
import RestTimer from "../components/RestTimer";

interface SetState {
  completed: boolean;
  reps: string;
  weight: string;
  logId?: string;
}

const HYPE_MESSAGES = [
  "Entreno completado, nivel legendario",
  "Evolucion conseguida, carinin",
  "Esas piernotas ya son Mewtwo tier",
  "Slay total en el gimnasio de la granja",
];

export default function WorkoutSessionPage() {
  const { planId, dayId } = useParams<{ planId: string; dayId: string }>();
  const navigate = useNavigate();
  const name = useProfileStore((s) => s.name);
  const { plans, fetch, refresh } = usePlansStore();
  const { exercises, loading: exLoading } = useExercises();

  const plan = plans.find((p) => p.id === planId);
  const day = plan?.days.find((d) => d.id === dayId);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sets, setSets] = useState<Record<string, SetState[]>>({});
  const [substituting, setSubstituting] = useState<PlanExercise | null>(null);
  const [finished, setFinished] = useState(false);
  const [activeRest, setActiveRest] = useState<{ peId: string; seconds: number } | null>(null);
  const [hypeMessage] = useState(HYPE_MESSAGES[Math.floor(Math.random() * HYPE_MESSAGES.length)]);

  useEffect(() => {
    if (name) fetch(name);
  }, [name, fetch]);

  useEffect(() => {
    if (!name || !plan || !day || sessionId) return;
    sessionsApi.startSession(name, plan.id, day.id, day.name).then((s) => setSessionId(s.id));
  }, [name, plan, day, sessionId]);

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

  const exerciseMap = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

  const persistSet = useCallback(
    async (
      peId: string,
      idx: number,
      exercise_id: string,
      exercise_name: string,
      state: SetState
    ) => {
      if (!sessionId) return;
      const log = await sessionsApi.upsertSetLog({
        session_id: sessionId,
        plan_exercise_id: peId,
        exercise_id,
        exercise_name,
        set_index: idx,
        reps_done: state.reps ? Number(state.reps) : null,
        weight_kg: state.weight ? Number(state.weight) : null,
        completed: state.completed,
        existingId: state.logId,
      });
      setSets((prev) => ({
        ...prev,
        [peId]: prev[peId].map((s, i) => (i === idx ? { ...s, logId: log.id } : s)),
      }));
    },
    [sessionId]
  );

  async function toggleSet(
    peId: string,
    idx: number,
    exercise_id: string,
    exercise_name: string,
    restSeconds: number
  ) {
    const current = sets[peId][idx];
    const completed = !current.completed;
    const next = { ...current, completed };
    setSets((prev) => ({
      ...prev,
      [peId]: prev[peId].map((s, i) => (i === idx ? next : s)),
    }));
    await persistSet(peId, idx, exercise_id, exercise_name, next);
    if (completed && restSeconds > 0) {
      setActiveRest({ peId, seconds: restSeconds });
    }
  }

  function updateField(peId: string, idx: number, field: "reps" | "weight", value: string) {
    setSets((prev) => ({
      ...prev,
      [peId]: prev[peId].map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  }

  async function saveFieldOnBlur(
    peId: string,
    idx: number,
    exercise_id: string,
    exercise_name: string
  ) {
    const state = sets[peId]?.[idx];
    if (!state) return;
    await persistSet(peId, idx, exercise_id, exercise_name, state);
  }

  function addSet(peId: string) {
    setSets((prev) => ({
      ...prev,
      [peId]: [...(prev[peId] ?? []), { completed: false, reps: "", weight: "" }],
    }));
  }

  async function handleFinish() {
    if (sessionId) await sessionsApi.completeSession(sessionId);
    setFinished(true);
  }

  async function handleSubstitute(newExerciseId: string) {
    if (!substituting || !name) return;
    await plansApi.substituteExercise(
      substituting.id,
      substituting.exercise_id,
      newExerciseId,
      substituting.original_exercise_id
    );
    await refresh(name);
    setSubstituting(null);
  }

  if (!name || exLoading || !plan) return <LoadingScreen label="Preparando entreno..." />;
  if (!day) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">No encontre ese dia</p>
      </div>
    );
  }

  const substituteSuggestions = substituting
    ? (() => {
        const current = exerciseMap.get(substituting.exercise_id);
        return current ? findSimilarExercises(exercises, current) : [];
      })()
    : [];

  const totalSets = Object.values(sets).reduce((acc, arr) => acc + arr.length, 0);
  const doneSets = Object.values(sets).reduce(
    (acc, arr) => acc + arr.filter((s) => s.completed).length,
    0
  );

  if (finished) {
    return (
      <div className="min-h-screen star-pattern flex flex-col items-center justify-center text-center gap-4 px-6">
        <CheckCircle2 size={64} className="text-meadow-500" />
        <h1 className="font-heading text-2xl text-gray-800">{hypeMessage}</h1>
        <p className="text-gray-500">"{day.name}" guardado. Tu evolucion ya cuenta.</p>
        <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
          <Link to="/progreso" className="game-btn py-3 font-semibold flex items-center justify-center gap-2">
            <TrendingUp size={18} /> Ver evolucion
          </Link>
          <button
            onClick={() => navigate(`/planes/${plan.id}`)}
            className="py-3 rounded-full border-2 border-wood-200 text-wood-700 font-heading"
          >
            Volver al plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-10 flex flex-col gap-4 min-h-screen">
      <button
        onClick={() => navigate(`/planes/${plan.id}`)}
        className="flex items-center gap-1 text-sm text-gray-500 font-heading self-start"
      >
        <X size={16} /> Salir
      </button>

      <div className="cozy-card p-4 sticky top-4 z-20">
        <p className="font-heading text-lg text-gray-800">{day.name}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="progress-bar-game flex-1">
            <div style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} />
          </div>
          <span className="text-xs font-heading text-meadow-600 shrink-0">
            {doneSets}/{totalSets} series
          </span>
        </div>
      </div>

      {day.exercises.map((pe) => {
        const ex = exerciseMap.get(pe.exercise_id);
        if (!ex) return null;
        const exSets = sets[pe.id] ?? [];
        const showRest = activeRest?.peId === pe.id;

        return (
          <div key={pe.id} className="cozy-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={`${import.meta.env.BASE_URL}${ex.image ?? ""}`}
                alt={ex.name}
                loading="lazy"
                className="w-16 h-16 rounded-xl object-cover bg-meadow-50 border-2 border-wood-100"
              />
              <div className="flex-1 min-w-0">
                <p className="font-heading text-gray-800 capitalize truncate">{ex.name}</p>
                <p className="text-xs text-gray-500">
                  Objetivo: {pe.sets} x {pe.reps} · descanso {pe.rest_seconds}s
                </p>
                {pe.notes && <p className="text-[11px] text-psychic-600 mt-0.5">{pe.notes}</p>}
              </div>
              <button
                onClick={() => setSubstituting(pe)}
                className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 shrink-0"
                title="Sustituir ejercicio"
              >
                <Repeat size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {exSets.map((s, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 rounded-xl p-2 border-2 ${
                    s.completed ? "bg-meadow-50 border-meadow-200" : "bg-white border-wood-100"
                  }`}
                >
                  <button
                    onClick={() => toggleSet(pe.id, idx, pe.exercise_id, ex.name, pe.rest_seconds)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition border-2 ${
                      s.completed
                        ? "bg-meadow-500 border-meadow-600 text-white"
                        : "bg-wood-50 border-wood-200 text-transparent"
                    }`}
                  >
                    <Check size={16} />
                  </button>
                  <span className="text-xs font-heading text-gray-500 w-12 shrink-0">S{idx + 1}</span>
                  <div className="flex-1 flex gap-1.5">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 block">Reps</label>
                      <input
                        value={s.reps}
                        onChange={(e) => updateField(pe.id, idx, "reps", e.target.value)}
                        onBlur={() => saveFieldOnBlur(pe.id, idx, pe.exercise_id, ex.name)}
                        placeholder={pe.reps}
                        inputMode="numeric"
                        className="w-full rounded-lg border border-wood-200 px-2 py-1.5 text-sm text-center outline-none focus:border-meadow-400 bg-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 block">Kg</label>
                      <input
                        value={s.weight}
                        onChange={(e) => updateField(pe.id, idx, "weight", e.target.value)}
                        onBlur={() => saveFieldOnBlur(pe.id, idx, pe.exercise_id, ex.name)}
                        placeholder="0"
                        inputMode="decimal"
                        className="w-full rounded-lg border border-wood-200 px-2 py-1.5 text-sm text-center outline-none focus:border-meadow-400 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => addSet(pe.id)}
              className="mt-2 flex items-center justify-center gap-1 w-full py-2 rounded-xl border-2 border-dashed border-wood-200 text-wood-600 text-xs font-heading"
            >
              <Plus size={14} /> Anadir serie extra
            </button>

            {showRest && activeRest && (
              <RestTimer
                seconds={activeRest.seconds}
                autoStart
                onComplete={() => setActiveRest(null)}
              />
            )}
          </div>
        );
      })}

      <button onClick={handleFinish} className="game-btn py-4 font-semibold text-lg mb-4">
        Terminar entreno
      </button>

      <ExercisePickerModal
        open={!!substituting}
        onClose={() => setSubstituting(null)}
        exercises={exercises}
        onPick={(ex) => handleSubstitute(ex.id)}
        title="Sustituir por..."
        suggested={substituteSuggestions}
      />
    </div>
  );
}
