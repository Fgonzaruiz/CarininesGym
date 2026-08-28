import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Check,
  Repeat,
  CheckCircle2,
  X,
  Plus,
  TrendingUp,
  Play,
  AlertTriangle,
} from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { usePlansStore } from "../store/plansStore";
import { useExercises } from "../hooks/useExercises";
import {
  exerciseUsesWeight,
  parseTargetReps,
  bodyPartLabel,
} from "../lib/exercises";
import {
  findSafeAlternatives,
  unsafeReasonsFor,
  unsafeEquipmentHint,
} from "../lib/injuries";
import { SESSION_TYPE_INFO, sessionTypeFromDayName } from "../lib/sessionTypes";
import { muscleKeyForTarget, MUSCLE_KEYS, type MuscleKey } from "../lib/muscleMap";
import MuscleMap, { type MuscleDetailItem } from "../components/MuscleMap";
import type { Exercise } from "../types/exercise";
import * as sessionsApi from "../lib/sessionsApi";
import * as plansApi from "../lib/plansApi";
import {
  isMewtwoMonthPlan,
  loadMewtwoProgress,
  getWeekMeta,
  onMewtwoSessionComplete,
} from "../lib/mewtwoProgress";
import type { PlanExercise, SessionType } from "../types/plan";
import { SESSION_TYPES } from "../types/plan";
import { CARININE_VOICE, pickRandom, isCarinineId } from "../types/profile";
import LoadingScreen from "../components/LoadingScreen";
import ExercisePickerModal from "../components/ExercisePickerModal";
import ExerciseDetailModal from "../components/ExerciseDetailModal";
import RestTimer from "../components/RestTimer";
import type { LastExerciseLog } from "../lib/sessionsApi";

interface SetState {
  completed: boolean;
  reps: string;
  weight: string;
  logId?: string;
}

export default function WorkoutSessionPage() {
  const { planId, dayId } = useParams<{ planId: string; dayId: string }>();
  const navigate = useNavigate();
  const name = useProfileStore((s) => s.name);
  const injuries = useProfileStore((s) => s.injuries);
  const { plans, fetch, refresh } = usePlansStore();
  const { exercises, loading: exLoading } = useExercises();

  const plan = plans.find((p) => p.id === planId);
  const day = plan?.days.find((d) => d.id === dayId);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<SessionType>("fuerza");
  const [sets, setSets] = useState<Record<string, SetState[]>>({});
  const [substituting, setSubstituting] = useState<PlanExercise | null>(null);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);
  const [lastLogs, setLastLogs] = useState<Map<string, LastExerciseLog>>(new Map());
  const [finished, setFinished] = useState(false);
  const [finishedCounts, setFinishedCounts] = useState<Record<string, number> | null>(null);
  const [finishedUntrained, setFinishedUntrained] = useState<MuscleKey[]>([]);
  const [finishedDetail, setFinishedDetail] = useState<
    Partial<Record<MuscleKey, MuscleDetailItem[]>>
  >({});
  const [weekAdvanceMessage, setWeekAdvanceMessage] = useState<string | null>(null);
  const [activeRest, setActiveRest] = useState<{ peId: string; seconds: number } | null>(null);
  const [hypeMessage] = useState(() =>
    name && isCarinineId(name) ? pickRandom(CARININE_VOICE[name].hypeMessages) : "Entreno completado"
  );
  const [finishNote] = useState(() =>
    name && isCarinineId(name) ? CARININE_VOICE[name].finishNote : "Registrado en tu progreso."
  );

  useEffect(() => {
    if (name) fetch(name);
  }, [name, fetch]);

  useEffect(() => {
    if (!name) return;
    sessionsApi.fetchLastLogsByExercise(name).then(setLastLogs).catch(() => {});
  }, [name]);

  useEffect(() => {
    if (!name || !plan || !day || sessionId) return;
    sessionsApi.startSession(name, plan.id, day.id, day.name).then((s) => setSessionId(s.id));
  }, [name, plan, day, sessionId]);

  useEffect(() => {
    if (!day || sessionId) return;
    const t = sessionTypeFromDayName(day.name);
    if (t && t !== "fuerza") setSessionType(t);
  }, [day, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    sessionsApi.updateSession(sessionId, { session_type: sessionType }).catch(() => {});
  }, [sessionId, sessionType]);

  useEffect(() => {
    if (!day) return;
    setSets((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const pe of day.exercises) {
        const ex = exercises.find((e) => e.id === pe.exercise_id);
        const last = lastLogs.get(pe.exercise_id);
        const defaultReps = parseTargetReps(pe.reps) ?? last?.reps_done?.toString() ?? "";
        const usesWeight = ex ? exerciseUsesWeight(pe.reps, ex.equipment) : true;
        const defaultWeight = usesWeight && last?.weight_kg ? String(last.weight_kg) : "";

        if (!next[pe.id]) {
          next[pe.id] = Array.from({ length: pe.sets }, () => ({
            completed: false,
            reps: defaultReps,
            weight: defaultWeight,
          }));
          changed = true;
          continue;
        }

        if (lastLogs.size === 0 && !defaultReps) continue;

        next[pe.id] = next[pe.id].map((s) => {
          if (s.completed) return s;
          const reps = s.reps || defaultReps;
          const weight = s.weight || defaultWeight;
          if (reps === s.reps && weight === s.weight) return s;
          changed = true;
          return { ...s, reps, weight };
        });
      }

      return changed ? next : prev;
    });
  }, [day, exercises, lastLogs]);

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

    // Músculos trabajados hoy (de las series completadas) y los que llevas sin tocar esta semana
    const todayCounts: Record<string, number> = {};
    const detailMap = new Map<MuscleKey, Map<string, MuscleDetailItem>>();
    for (const pe of day?.exercises ?? []) {
      const anyCompleted = (sets[pe.id] ?? []).some((s) => s.completed);
      if (!anyCompleted) continue;
      const ex = exerciseMap.get(pe.exercise_id);
      if (!ex) continue;
      const ms = new Set<MuscleKey>();
      const t = muscleKeyForTarget(ex.target);
      if (t) ms.add(t);
      for (const sec of ex.secondary_muscles) {
        const k = muscleKeyForTarget(sec);
        if (k) ms.add(k);
      }
      for (const m of ms) {
        todayCounts[m] = 1;
        let map = detailMap.get(m);
        if (!map) {
          map = new Map();
          detailMap.set(m, map);
        }
        const cur = map.get(ex.id);
        if (cur) cur.sessions += 1;
        else map.set(ex.id, { id: ex.id, name: ex.name, sessions: 1 });
      }
    }
    const detail: Partial<Record<MuscleKey, MuscleDetailItem[]>> = {};
    for (const [m, map] of detailMap) {
      detail[m] = Array.from(map.values());
    }
    setFinishedCounts(todayCounts);
    setFinishedDetail(detail);

    if (name) {
      try {
        const weekMap = await sessionsApi.fetchExerciseIdsBySessionInRange(name, "week");
        const exById = new Map(exercises.map((e) => [e.id, e]));
        const weekCounts: Record<string, number> = {};
        for (const exIds of weekMap.values()) {
          const muscles = new Set<MuscleKey>();
          for (const eid of exIds) {
            const ex = exById.get(eid);
            if (!ex) continue;
            const t = muscleKeyForTarget(ex.target);
            if (t) muscles.add(t);
            for (const sec of ex.secondary_muscles) {
              const k = muscleKeyForTarget(sec);
              if (k) muscles.add(k);
            }
          }
          for (const m of muscles) weekCounts[m] = (weekCounts[m] ?? 0) + 1;
        }
        setFinishedUntrained(MUSCLE_KEYS.filter((k) => !((weekCounts[k] ?? 0) > 0)));
      } catch {
        setFinishedUntrained([]);
      }
    }

    if (name && plan && isMewtwoMonthPlan(plan)) {
      const history = await sessionsApi.fetchHistory(name, 80);
      const beforeWeek = loadMewtwoProgress(name).week;
      const after = onMewtwoSessionComplete(name, plan, history);
      if (after.week !== beforeWeek) {
        const meta = getWeekMeta(after.week);
        const voice = isCarinineId(name) ? CARININE_VOICE[name] : null;
        setWeekAdvanceMessage(
          after.week === 1 && beforeWeek === 4
            ? voice?.monthDone ?? "Mes completado. Nuevo ciclo."
            : voice?.weekUnlocked(meta.title) ?? `Semana desbloqueada: ${meta.title}`
        );
      }
    }

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
        return current
          ? findSafeAlternatives(exercises, current, injuries, 10)
          : [];
      })()
    : [];

  const totalSets = Object.values(sets).reduce((acc, arr) => acc + arr.length, 0);
  const doneSets = Object.values(sets).reduce(
    (acc, arr) => acc + arr.filter((s) => s.completed).length,
    0
  );

  if (finished) {
    return (
      <div className="min-h-screen star-pattern flex flex-col items-center justify-center text-center gap-4 px-6 py-10 overflow-y-auto">
        <CheckCircle2 size={64} className="text-meadow-500" />
        <h1 className="font-heading text-2xl text-gray-800">{hypeMessage}</h1>
        <p className="text-gray-500">
          "{day.name}" · {SESSION_TYPE_INFO[sessionType].label} guardado. {finishNote}
        </p>
        {weekAdvanceMessage && (
          <p className={`text-sm font-heading px-4 ${name === "Knifey" ? "text-psychic-600" : "text-meadow-600"}`}>
            {weekAdvanceMessage}
          </p>
        )}

        {finishedCounts && (
          <div className="cozy-card p-4 w-full max-w-md">
            <h2 className="font-heading text-sm text-gray-700 mb-2">
              Qué has trabajado hoy 💪
            </h2>
            <MuscleMap
              counts={finishedCounts}
              periodLabel="Sesiones"
              summaryLabel="hoy"
              untrainedLabel="sin tocar esta semana"
              untrained={finishedUntrained}
              muscleDetail={finishedDetail}
              catalog={exercises}
              injuries={injuries}
              onViewExercise={(id) => {
                const ex = exercises.find((e) => e.id === id);
                if (ex) setDetailExercise(ex);
              }}
            />
          </div>
        )}

        <div className="flex flex-col gap-2 w-full max-w-xs mt-1">
          <Link to="/progreso" className="game-btn py-3 font-semibold flex items-center justify-center gap-2">
            <TrendingUp size={18} /> Ver progreso
          </Link>
          <button
            onClick={() => navigate(`/planes/${plan.id}`)}
            className="py-3 rounded-full border-2 border-wood-200 text-wood-700 font-heading"
          >
            Volver al plan
          </button>
        </div>

        <ExerciseDetailModal
          exercise={detailExercise}
          open={!!detailExercise}
          onClose={() => setDetailExercise(null)}
          exercises={exercises}
          injuries={injuries}
        />
      </div>
    );
  }

  return (
    <div className="game-bg min-h-screen max-w-3xl mx-auto px-4 pt-4 pb-10 flex flex-col gap-4">
      <button
        onClick={() => navigate(`/planes/${plan.id}`)}
        className="flex items-center gap-1 text-sm text-gray-500 font-heading self-start"
      >
        <X size={16} /> Salir
      </button>

      <div className="cozy-card p-4 sticky top-4 z-20">
        <p className="font-heading text-lg text-gray-800">{day.name}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {SESSION_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setSessionType(t)}
              className={`chip border shrink-0 ${
                sessionType === t
                  ? `${SESSION_TYPE_INFO[t].chipClass} border-transparent`
                  : "bg-white text-gray-400 border-wood-200"
              }`}
            >
              {SESSION_TYPE_INFO[t].label}
            </button>
          ))}
        </div>
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
        const usesWeight = exerciseUsesWeight(pe.reps, ex.equipment);
        const last = lastLogs.get(pe.exercise_id);
        const recommendedWeight = usesWeight
          ? last?.weight_kg
            ? `${last.weight_kg} kg`
            : "Sin historial"
          : ex.equipment === "body weight"
            ? "Peso corporal"
            : "—";
        const instructionPreview =
          ex.steps_es[0] ?? ex.instructions_es.slice(0, 140) + (ex.instructions_es.length > 140 ? "…" : "");

        return (
          <div key={pe.id} className="cozy-card p-4">
            <div className="flex items-start gap-3 mb-3">
              <button
                type="button"
                onClick={() => setDetailExercise(ex)}
                className="relative shrink-0 rounded-xl overflow-hidden border-2 border-wood-100 active:scale-[0.97] transition"
                aria-label="Ver ejercicio en movimiento"
              >
                <img
                  src={`${import.meta.env.BASE_URL}${ex.image ?? ""}`}
                  alt={ex.name}
                  loading="lazy"
                  className="w-20 h-20 object-cover bg-meadow-50"
                />
                {ex.gif && (
                  <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 text-white gap-0.5">
                    <Play size={18} fill="white" />
                    <span className="text-[9px] font-heading">Ver GIF</span>
                  </span>
                )}
              </button>
              <div className="flex-1 min-w-0">
        <p className="font-heading text-gray-800 capitalize">{ex.name}</p>
        {injuries.length > 0 && unsafeReasonsFor(ex, injuries).length > 0 && (
          <p className="flex items-center gap-1 text-[10px] font-heading text-pinky-600 mt-1">
            <AlertTriangle size={11} /> Carga tu {unsafeEquipmentHint(injuries)} · mejor sustitúyelo
          </p>
        )}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[11px]">
                  <p className="text-gray-500">
                    <span className="text-gray-400">Series:</span> {pe.sets} x {pe.reps}
                  </p>
                  <p className="text-gray-500">
                    <span className="text-gray-400">Descanso:</span> {pe.rest_seconds}s
                  </p>
                  <p className="text-gray-500">
                    <span className="text-gray-400">Peso rec.:</span>{" "}
                    <span className="font-heading text-meadow-700">{recommendedWeight}</span>
                  </p>
                  <p className="text-gray-500 capitalize truncate">
                    <span className="text-gray-400">Zona:</span> {bodyPartLabel(ex.body_part)}
                  </p>
                </div>
                {ex.secondary_muscles.length > 0 && (
                  <p className="text-[10px] text-gray-400 capitalize truncate mt-1">
                    También: {ex.secondary_muscles.slice(0, 4).join(", ")}
                    {ex.secondary_muscles.length > 4 ? "…" : ""}
                  </p>
                )}
                {pe.notes && <p className="text-[11px] text-psychic-600 mt-1.5">{pe.notes}</p>}
              </div>
              <button
                onClick={() => setSubstituting(pe)}
                className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 shrink-0"
                title="Sustituir ejercicio"
              >
                <Repeat size={16} />
              </button>
            </div>

            {instructionPreview && (
              <button
                type="button"
                onClick={() => setDetailExercise(ex)}
                className="w-full text-left mb-3 p-3 rounded-xl bg-wood-50/80 border border-wood-100 active:scale-[0.99] transition"
              >
                <p className="text-[10px] font-heading uppercase tracking-wide text-gray-400 mb-1">
                  Como se hace · pulsa para ver completo
                </p>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{instructionPreview}</p>
              </button>
            )}

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
                  <div className={`flex-1 flex gap-1.5 ${usesWeight ? "" : "justify-center"}`}>
                    <div className={usesWeight ? "flex-1" : "flex-[2]"}>
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
                    {usesWeight && (
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-400 block">Kg</label>
                        <input
                          value={s.weight}
                          onChange={(e) => updateField(pe.id, idx, "weight", e.target.value)}
                          onBlur={() => saveFieldOnBlur(pe.id, idx, pe.exercise_id, ex.name)}
                          placeholder={last?.weight_kg ? String(last.weight_kg) : "0"}
                          inputMode="decimal"
                          className="w-full rounded-lg border border-wood-200 px-2 py-1.5 text-sm text-center outline-none focus:border-meadow-400 bg-white"
                        />
                      </div>
                    )}
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
        injuries={injuries}
      />

      <ExerciseDetailModal
        exercise={detailExercise}
        open={!!detailExercise}
        onClose={() => setDetailExercise(null)}
        exercises={exercises}
        injuries={injuries}
      />
    </div>
  );
}
