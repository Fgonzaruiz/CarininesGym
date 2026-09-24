import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
  Bot,
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
import PainAssistantModal from "../components/PainAssistantModal";
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
import type { LastExerciseLog, RecentPoint } from "../lib/sessionsApi";
import { describeError } from "../lib/errors";
import { suggestNext, isStalled, type PR } from "../lib/progression";

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
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [progression, setProgression] = useState<Map<string, RecentPoint[]>>(new Map());
  const [prs, setPrs] = useState<PR[]>([]);
  const [missingWarning, setMissingWarning] = useState<null | {
    missingWeight: number;
    missingReps: number;
    emptyExercises: string[];
  }>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const creatingRef = useRef(false);

  useEffect(() => {
    if (name) fetch(name);
  }, [name, fetch]);

  useEffect(() => {
    if (!name) return;
    sessionsApi.fetchLastLogsByExercise(name).then(setLastLogs).catch(() => {});
  }, [name]);

  useEffect(() => {
    if (!name || !day) return;
    const ids = day.exercises.map((pe) => pe.exercise_id);
    sessionsApi
      .fetchRecentProgression(name, ids, 4)
      .then(setProgression)
      .catch(() => {});
  }, [name, day]);

  const createSession = useCallback(async () => {
    if (!name || !plan || !day || sessionId || creatingRef.current) return;
    creatingRef.current = true;
    setSessionError(null);
    try {
      const s = await sessionsApi.startSession(name, plan.id, day.id, day.name);
      setSessionId(s.id);
      // Limpieza silenciosa de fantasmas antiguos (no toca la sesión en curso).
      sessionsApi.cleanupGhostSessions(name, s.id).catch(() => {});
    } catch (err) {
      setSessionError(describeError(err));
    } finally {
      creatingRef.current = false;
    }
  }, [name, plan, day, sessionId]);

  useEffect(() => {
    if (name && plan && day && !sessionId) void createSession();
  }, [name, plan, day, sessionId, createSession]);

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

  function fillWithSuggestion(peId: string, weight: number | null, reps: string) {
    const repsNum = reps.match(/^(\d+)/)?.[1] ?? "";
    setSets((prev) => ({
      ...prev,
      [peId]: (prev[peId] ?? []).map((s) =>
        s.completed
          ? s
          : { ...s, weight: weight != null ? String(weight) : s.weight, reps: s.reps || repsNum }
      ),
    }));
    setMissingWarning(null);
  }

  async function handleFinish() {
    if (finishing) return;

    // Anti-olvidos: si hay series completadas sin peso/reps en ejercicios con peso, avisa una vez.
    if (!confirmFinish && day) {
      let missingWeight = 0;
      let missingReps = 0;
      const emptyExercises = new Set<string>();
      for (const pe of day.exercises) {
        const ex = exerciseMap.get(pe.exercise_id);
        if (!ex) continue;
        const needsWeight = exerciseUsesWeight(pe.reps, ex.equipment);
        for (const s of sets[pe.id] ?? []) {
          if (!s.completed) continue;
          if (needsWeight && !s.weight) {
            missingWeight += 1;
            emptyExercises.add(ex.name);
          }
          if (!s.reps) {
            missingReps += 1;
            emptyExercises.add(ex.name);
          }
        }
      }
      if (missingWeight > 0 || missingReps > 0) {
        setMissingWarning({
          missingWeight,
          missingReps,
          emptyExercises: [...emptyExercises].slice(0, 4),
        });
        setConfirmFinish(true);
        return;
      }
    }
    setMissingWarning(null);
    setFinishing(true);
    setFinishError(null);

    let sid = sessionId;
    try {
      // Si la sesión no se pudo crear antes (p. ej. sin conexión), se vuelve a
      // intentar al terminar. Además se re-sincronizan todas las series para
      // que ningún dato quede sin guardar.
      if (!sid) {
        if (!name || !plan || !day) {
          throw new Error("Faltan datos del plan para guardar el entreno.");
        }
        const created = await sessionsApi.startSession(name, plan.id, day.id, day.name);
        setSessionId(created.id);
        sid = created.id;
      }

      for (const [peId, arr] of Object.entries(sets)) {
        const pe = day?.exercises.find((e) => e.id === peId);
        if (!pe) continue;
        const ex = exerciseMap.get(pe.exercise_id);
        if (!ex) continue;
        for (let i = 0; i < arr.length; i++) {
          const s = arr[i];
          if (!s.reps && !s.weight && !s.completed) continue;
          await sessionsApi.upsertSetLog({
            session_id: sid,
            plan_exercise_id: peId,
            exercise_id: pe.exercise_id,
            exercise_name: ex.name,
            set_index: i,
            reps_done: s.reps ? Number(s.reps) : null,
            weight_kg: s.weight ? Number(s.weight) : null,
            completed: s.completed,
            existingId: s.logId,
          });
        }
      }

      await sessionsApi.completeSession(sid);
    } catch (err) {
      setFinishError(describeError(err));
      setFinishing(false);
      return;
    }

    // PRs: compara lo de hoy con el historial previo (lastLogs + progression).
    try {
      const found: PR[] = [];
      for (const pe of day?.exercises ?? []) {
        const ex = exerciseMap.get(pe.exercise_id);
        if (!ex) continue;
        const done = (sets[pe.id] ?? []).filter((s) => s.completed);
        if (done.length === 0) continue;
        const todayW = Math.max(...done.map((s) => Number(s.weight) || 0));
        const todayR = Math.max(...done.map((s) => Number(s.reps) || 0));
        const todayVol = done.reduce(
          (acc, s) => acc + (Number(s.weight) || 0) * (Number(s.reps) || 0),
          0
        );
        const prev = lastLogs.get(pe.exercise_id);
        const prevW = prev?.weight_kg ?? 0;
        const prevR = prev?.reps_done ?? 0;
        const hist = progression.get(pe.exercise_id) ?? [];
        const bestW = Math.max(prevW, ...hist.map((h) => h.maxWeight));
        const bestR = Math.max(prevR, ...hist.map((h) => h.maxReps));
        if (todayW > bestW && todayW > 0) {
          found.push({
            exercise_id: pe.exercise_id,
            exercise_name: ex.name,
            kind: "peso",
            detail: `${todayW} kg (antes ${bestW} kg)`,
          });
        } else if (todayR > bestR && todayW >= bestW && todayW > 0) {
          found.push({
            exercise_id: pe.exercise_id,
            exercise_name: ex.name,
            kind: "reps",
            detail: `${todayR} reps con ${todayW} kg`,
          });
        } else if (todayVol > 0 && bestW > 0 && todayW >= bestW && done.length >= 3) {
          // Volumen como mención suave solo si iguala peso con buen trabajo.
        }
      }
      setPrs(found.slice(0, 6));
    } catch {
      setPrs([]);
    }

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
      try {
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
      } catch {
        // Si falla el avance de semana (p. ej. sin conexión) el entreno ya está guardado.
      }
    }

    setFinishing(false);
    setConfirmFinish(false);
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

        {prs.length > 0 && (
          <div className="cozy-card p-4 w-full max-w-md border-2 border-amber-200">
            <h2 className="font-heading text-sm text-amber-700 mb-2">
              Nuevos récords
            </h2>
            <div className="flex flex-col gap-1.5 text-left">
              {prs.map((pr) => (
                <p key={pr.exercise_id} className="text-xs text-gray-700 capitalize">
                  <span className="font-heading text-amber-600">PR {pr.kind} · </span>
                  {pr.exercise_name}: {pr.detail}
                </p>
              ))}
            </div>
          </div>
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
        <div className="flex items-center justify-between gap-3">
          <p className="font-heading text-lg text-gray-800">{day.name}</p>
          <button
            onClick={() => setAssistantOpen(true)}
            className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full bg-psychic-50 border border-psychic-200 text-psychic-600 text-xs font-heading hover:bg-psychic-100 active:scale-95 transition"
            title="Cuéntale al asistente qué te duele y adapta el entreno"
          >
            <Bot size={14} /> ¿Te duele algo?
          </button>
        </div>
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

      {sessionError && !sessionId && (
        <div className="cozy-card p-4 border-2 border-pinky-200">
          <p className="text-sm font-heading text-pinky-600">
            No se ha podido registrar este entreno en la nube todavía.
          </p>
          <p className="text-xs text-gray-500 mt-1 break-words">{sessionError}</p>
          <p className="text-xs text-gray-400 mt-1">
            Comprueba tu conexión. Podrás reintentarlo al terminar; las series que vayas
            marcando se guardarán igualmente.
          </p>
          <button
            onClick={() => void createSession()}
            className="btn-kawaii px-4 py-2 text-sm font-semibold mt-3"
          >
            Reintentar conexión
          </button>
        </div>
      )}

      {day.exercises.map((pe) => {
        const ex = exerciseMap.get(pe.exercise_id);
        if (!ex) return null;
        const exSets = sets[pe.id] ?? [];
        const showRest = activeRest?.peId === pe.id;
        const usesWeight = exerciseUsesWeight(pe.reps, ex.equipment);
        const last = lastLogs.get(pe.exercise_id);
        const recent = progression.get(pe.exercise_id) ?? [];
        const stalled = isStalled(recent);
        const suggestion = usesWeight
          ? suggestNext(
              last?.weight_kg ?? null,
              last?.reps_done ?? null,
              pe.reps,
              ex.body_part
            )
          : null;
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
                {suggestion && last?.weight_kg != null && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <p className="text-[11px] text-gray-600">
                      <span className="text-gray-400">Hoy:</span>{" "}
                      <span className="font-heading text-gray-800">{suggestion.label}</span>
                    </p>
                    {stalled && (
                      <span className="chip bg-amber-100 text-amber-700 border border-amber-200">
                        Estancado 3 sesiones
                      </span>
                    )}
                    {suggestion.weight != null && (
                      <button
                        onClick={() => fillWithSuggestion(pe.id, suggestion.weight, pe.reps)}
                        className="text-[11px] font-heading px-2.5 py-1 rounded-full bg-meadow-100 border border-meadow-200 text-meadow-700 active:scale-95 transition"
                      >
                        Rellenar {suggestion.weight} kg
                      </button>
                    )}
                  </div>
                )}
                {stalled && (!suggestion || last?.weight_kg == null) && (
                  <p className="mt-2 text-[11px] font-heading text-amber-600">
                    Llevas 3 sesiones clavado: prueba +1 rep o cambia variante
                  </p>
                )}
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

      {missingWarning && (
        <div className="cozy-card p-4 border-2 border-amber-200">
          <p className="text-sm font-heading text-amber-700">
            Tienes {missingWarning.missingWeight > 0 ? `${missingWarning.missingWeight} series sin peso` : ""}
            {missingWarning.missingWeight > 0 && missingWarning.missingReps > 0 ? " y " : ""}
            {missingWarning.missingReps > 0 ? `${missingWarning.missingReps} sin reps` : ""}.
          </p>
          {missingWarning.emptyExercises.length > 0 && (
            <p className="text-xs text-gray-500 mt-1 capitalize">
              Revisa: {missingWarning.emptyExercises.join(", ")}
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                setMissingWarning(null);
                setConfirmFinish(false);
              }}
              className="flex-1 py-2 rounded-full border-2 border-wood-200 text-wood-700 text-sm font-heading"
            >
              Revisar
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 py-2 rounded-full bg-amber-500 text-white text-sm font-heading"
            >
              Terminar igual
            </button>
          </div>
        </div>
      )}
      {finishError && (
        <div className="cozy-card p-4 border-2 border-pinky-200">
          <p className="text-sm font-heading text-pinky-600">No se ha guardado el entreno.</p>
          <p className="text-xs text-gray-500 mt-1 break-words">{finishError}</p>
          <p className="text-xs text-gray-400 mt-1">
            Revisa tu conexión y pulsa de nuevo en "Terminar entreno": se reintentará
            guardar la sesión y todas las series.
          </p>
        </div>
      )}
      <button
        onClick={handleFinish}
        disabled={finishing}
        className="game-btn py-4 font-semibold text-lg mb-4 disabled:opacity-60"
      >
        {finishing ? "Guardando..." : confirmFinish ? "Confirmar y terminar" : "Terminar entreno"}
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

      <PainAssistantModal
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        dayName={day.name}
        exercises={exercises}
        dayExercises={day.exercises}
        injuries={injuries}
      />
    </div>
  );
}
