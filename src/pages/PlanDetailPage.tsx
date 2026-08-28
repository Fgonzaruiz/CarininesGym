import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Repeat,
  Pencil,
  Play,
  ArrowLeft,
  RotateCcw,
  Dumbbell,
  AlertTriangle,
} from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { usePlansStore } from "../store/plansStore";
import { useExercises } from "../hooks/useExercises";
import { getExerciseById } from "../lib/exercises";
import {
  findSafeAlternatives,
  unsafeReasonsFor,
  unsafeEquipmentHint,
} from "../lib/injuries";
import * as api from "../lib/plansApi";
import type { PlanExercise } from "../types/plan";
import {
  isMewtwoMonthPlan,
  loadMewtwoProgress,
  getWeekDays,
  getWeekMeta,
} from "../lib/mewtwoProgress";
import {
  isGeneratedPlan,
  generatedPlanWeeks,
} from "../lib/planGenerator";
import { SESSION_TYPE_INFO, sessionTypeFromDayName } from "../lib/sessionTypes";
import LoadingScreen from "../components/LoadingScreen";
import Modal from "../components/Modal";
import ExercisePickerModal from "../components/ExercisePickerModal";

export default function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const name = useProfileStore((s) => s.name);
  const injuries = useProfileStore((s) => s.injuries);
  const { plans, fetch, refresh } = usePlansStore();
  const { exercises, loading: exercisesLoading } = useExercises();

  const plan = plans.find((p) => p.id === planId);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [addingDay, setAddingDay] = useState(false);
  const [newDayName, setNewDayName] = useState("");
  const [pickerForDay, setPickerForDay] = useState<string | null>(null);
  const [substitutingExercise, setSubstitutingExercise] = useState<PlanExercise | null>(null);
  const [editingExercise, setEditingExercise] = useState<PlanExercise | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (name) fetch(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  useEffect(() => {
    if (plan && !openDay && plan.days.length > 0) {
      if (name && isMewtwoMonthPlan(plan)) {
        const progress = loadMewtwoProgress(name);
        const weekDays = getWeekDays(plan, progress.week);
        setOpenDay(weekDays[0]?.id ?? plan.days[0].id);
      } else {
        setOpenDay(plan.days[0].id);
      }
    }
  }, [plan, openDay, name]);

  const exerciseMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getExerciseById>>();
    for (const ex of exercises) map.set(ex.id, ex);
    return map;
  }, [exercises]);

  const mewtwoProgress = useMemo(() => {
    if (!name || !plan || !isMewtwoMonthPlan(plan)) return null;
    return loadMewtwoProgress(name);
  }, [name, plan]);

  const mewtwoWeekGroups = useMemo(() => {
    if (!plan || !isMewtwoMonthPlan(plan)) return null;
    return [1, 2, 3, 4].map((week) => ({
      week,
      meta: getWeekMeta(week),
      days: getWeekDays(plan, week),
    }));
  }, [plan]);

  const generatedWeeks = useMemo(() => {
    if (!plan || !isGeneratedPlan(plan)) return null;
    return generatedPlanWeeks(plan);
  }, [plan]);

  if (!name || exercisesLoading || (plans.length === 0 && !plan)) {
    return <LoadingScreen label="Preparando tu plan..." />;
  }
  if (!plan) {
    return (
      <div className="text-center py-16">
        <p className="text-bubble-500">No encontré ese plan</p>
        <button onClick={() => navigate("/planes")} className="btn-kawaii mt-4 px-5 py-2">
          Volver a planes
        </button>
      </div>
    );
  }

  const currentPlan = plan;

  async function withRefresh(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      await refresh(name!);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddDay() {
    if (!newDayName.trim()) return;
    await withRefresh(() =>
      api.addPlanDay(currentPlan.id, currentPlan.days.length, {
        name: newDayName.trim(),
      }).then(() => {})
    );
    setAddingDay(false);
    setNewDayName("");
  }

  async function handleDeleteDay(dayId: string) {
    if (!confirm("¿Borrar este día del plan?")) return;
    await withRefresh(() => api.deletePlanDay(dayId));
  }

  async function handleDeletePlan() {
    if (!confirm(`Borrar el plan "${currentPlan.name}"? Se eliminara con todos sus dias.`)) return;
    await withRefresh(() => api.deletePlan(currentPlan.id));
    navigate("/planes");
  }

  async function handlePickExercise(dayId: string, exerciseId: string) {
    const day = currentPlan.days.find((d) => d.id === dayId);
    await withRefresh(() =>
      api.addExerciseToDay(dayId, day?.exercises.length ?? 0, {
        exercise_id: exerciseId,
        sets: 3,
        reps: "12",
        rest_seconds: 60,
      }).then(() => {})
    );
    setPickerForDay(null);
  }

  async function handleRemoveExercise(id: string) {
    await withRefresh(() => api.removePlanExercise(id));
  }

  async function handleSubstitute(newExerciseId: string) {
    if (!substitutingExercise) return;
    await withRefresh(() =>
      api.substituteExercise(
        substitutingExercise.id,
        substitutingExercise.exercise_id,
        newExerciseId,
        substitutingExercise.original_exercise_id
      )
    );
    setSubstitutingExercise(null);
  }

  async function handleRestore(pe: PlanExercise) {
    if (!pe.original_exercise_id) return;
    await withRefresh(() => api.restoreOriginalExercise(pe.id, pe.original_exercise_id!));
  }

  async function handleSaveEdit(sets: number, reps: string, rest: number, notes: string) {
    if (!editingExercise) return;
    await withRefresh(() =>
      api.updatePlanExercise(editingExercise.id, {
        sets,
        reps,
        rest_seconds: rest,
        notes: notes || null,
      })
    );
    setEditingExercise(null);
  }

  const substituteSuggestions = substitutingExercise
    ? (() => {
        const current = exerciseMap.get(substitutingExercise.exercise_id);
        return current
          ? findSafeAlternatives(exercises, current, injuries, 10)
          : [];
      })()
    : [];

  function renderDayCard(day: (typeof currentPlan.days)[number], dayIdx: number) {
    const isOpen = openDay === day.id;
    const dayType = sessionTypeFromDayName(day.name);
    return (
      <div key={day.id} className="kawaii-card overflow-hidden">
        <button
          onClick={() => setOpenDay(isOpen ? null : day.id)}
          className="w-full flex items-center gap-3 p-4 text-left"
        >
          <span className="w-8 h-8 rounded-full bg-bubble-100 text-bubble-600 font-heading text-sm flex items-center justify-center shrink-0">
            {dayIdx + 1}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-heading text-bubble-700">{day.name}</p>
              {dayType && (
                <span className={`chip border-transparent ${SESSION_TYPE_INFO[dayType].chipClass}`}>
                  {SESSION_TYPE_INFO[dayType].label}
                </span>
              )}
            </div>
            <p className="text-xs text-bubble-400">{day.exercises.length} ejercicios</p>
          </div>
          {isOpen ? (
            <ChevronUp size={18} className="text-bubble-300" />
          ) : (
            <ChevronDown size={18} className="text-bubble-300" />
          )}
        </button>

        {isOpen && (
          <div className="px-4 pb-4 flex flex-col gap-2.5">
            {day.exercises.map((pe) => {
              const ex = exerciseMap.get(pe.exercise_id);
              if (!ex) return null;
              return (
                <div
                  key={pe.id}
                  className="flex items-center gap-2.5 bg-bubble-50/70 rounded-2xl p-2.5"
                >
                  <img
                    src={`${import.meta.env.BASE_URL}${ex.image ?? ""}`}
                    alt={ex.name}
                    loading="lazy"
                    className="w-12 h-12 rounded-xl object-cover bg-white shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm text-bubble-700 capitalize truncate">
                      {ex.name}
                    </p>
                    <p className="text-xs text-bubble-400">
                      {pe.sets} x {pe.reps} · descanso {pe.rest_seconds}s
                    </p>
                    {injuries.length > 0 && unsafeReasonsFor(ex, injuries).length > 0 && (
                      <p className="flex items-center gap-1 text-[10px] font-heading text-pinky-500 mt-0.5">
                        <AlertTriangle size={10} /> Carga tu {unsafeEquipmentHint(injuries)}
                      </p>
                    )}
                    {pe.notes && (
                      <p className="text-[11px] text-pinky-500 mt-0.5">{pe.notes}</p>
                    )}
                    {pe.substituted_at && (
                      <button
                        onClick={() => handleRestore(pe)}
                        className="text-[11px] text-sky-glow-500 flex items-center gap-0.5 mt-0.5"
                      >
                        <RotateCcw size={10} /> sustituido, restaurar original
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => setEditingExercise(pe)}
                      className="p-1.5 rounded-full bg-white text-bubble-500"
                      aria-label="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setSubstitutingExercise(pe)}
                      className="p-1.5 rounded-full bg-white text-sky-glow-500"
                      aria-label="Sustituir"
                    >
                      <Repeat size={14} />
                    </button>
                    <button
                      onClick={() => handleRemoveExercise(pe.id)}
                      className="p-1.5 rounded-full bg-white text-pinky-500"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setPickerForDay(day.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full border-2 border-dashed border-bubble-200 text-bubble-500 text-sm font-heading"
              >
                <Plus size={16} /> Añadir ejercicio
              </button>
              <button
                onClick={() => handleDeleteDay(day.id)}
                className="px-3.5 rounded-full border-2 border-dashed border-pinky-200 text-pinky-400"
                aria-label="Borrar día"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {day.exercises.length > 0 && (
              <button
                onClick={() => navigate(`/entrenar/${currentPlan.id}/${day.id}`)}
                className="btn-kawaii py-3 font-semibold flex items-center justify-center gap-2 mt-1"
              >
                <Play size={16} /> Empezar entreno
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => navigate("/planes")}
        className="flex items-center gap-1 text-sm text-bubble-400 font-heading"
      >
        <ArrowLeft size={16} /> Planes
      </button>

      <div className="kawaii-card p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-bubble-50 flex items-center justify-center shrink-0">
            <Dumbbell size={22} className="text-bubble-500" />
          </div>
          <div>
            <h1 className="font-heading text-xl text-bubble-700">{plan.name}</h1>
            {plan.is_default && (
              <span className="chip bg-pinky-100 text-pinky-500">plan por defecto</span>
            )}
          </div>
        </div>
        {plan.description && (
          <p className="text-sm text-bubble-500 mt-3 leading-relaxed">{plan.description}</p>
        )}
        {mewtwoProgress && (
          <p className="text-xs font-heading text-psychic-600 mt-3">
            Semana activa: {getWeekMeta(mewtwoProgress.week).title}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {mewtwoWeekGroups
          ? mewtwoWeekGroups.map((group) => (
              <div key={group.week} className="flex flex-col gap-2">
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    group.week === mewtwoProgress?.week
                      ? "bg-psychic-50 border border-psychic-200"
                      : "bg-bubble-50/60"
                  }`}
                >
                  <p className="font-heading text-bubble-700">{group.meta.title}</p>
                  <p className="text-xs text-bubble-400 mt-0.5">{group.meta.subtitle}</p>
                  {group.week === mewtwoProgress?.week && (
                    <span className="inline-block mt-2 chip bg-psychic-100 text-psychic-700 text-[11px]">
                      Semana actual
                    </span>
                  )}
                </div>
                {group.days.map((day, idx) => renderDayCard(day, idx))}
              </div>
            ))
          : generatedWeeks
            ? generatedWeeks.map((group) => (
                <div key={group.week} className="flex flex-col gap-2">
                  <div className="rounded-2xl px-4 py-3 bg-bubble-50/60">
                    <p className="font-heading text-bubble-700">Semana {group.week}</p>
                    <p className="text-xs text-bubble-400 mt-0.5">
                      {group.days.length} días · las semanas 3-4 suben intensidad
                    </p>
                  </div>
                  {group.days.map((day, idx) => renderDayCard(day, idx))}
                </div>
              ))
            : plan.days.map((day, dayIdx) => renderDayCard(day, dayIdx))}

        {!mewtwoWeekGroups && (
          <button
            onClick={() => setAddingDay(true)}
            className="flex items-center justify-center gap-1.5 py-3 rounded-full border-2 border-dashed border-bubble-200 text-bubble-500 text-sm font-heading"
          >
            <Plus size={16} /> Añadir día
          </button>
        )}
      </div>

      <button
        onClick={handleDeletePlan}
        disabled={busy}
        className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-pinky-200 text-pinky-600 font-heading text-sm active:scale-[0.98] disabled:opacity-50"
      >
        <Trash2 size={16} /> Borrar plan
      </button>

      {busy && (
        <p className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 chip bg-bubble-600 text-white z-50">
          guardando...
        </p>
      )}

      <Modal open={addingDay} onClose={() => setAddingDay(false)} title="Nuevo día">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-heading text-bubble-500">Nombre del día</label>
            <input
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              placeholder="ej: Espalda de Reina"
              className="mt-1 w-full rounded-2xl border border-bubble-200 px-4 py-2.5 outline-none focus:border-bubble-400"
            />
          </div>
          <button
            onClick={handleAddDay}
            disabled={!newDayName.trim()}
            className="btn-kawaii py-3 font-semibold disabled:opacity-60"
          >
            Añadir día
          </button>
        </div>
      </Modal>

      <ExercisePickerModal
        open={!!pickerForDay}
        onClose={() => setPickerForDay(null)}
        exercises={exercises}
        onPick={(ex) => pickerForDay && handlePickExercise(pickerForDay, ex.id)}
        title="Añadir ejercicio"
        injuries={injuries}
      />

      <ExercisePickerModal
        open={!!substitutingExercise}
        onClose={() => setSubstitutingExercise(null)}
        exercises={exercises}
        onPick={(ex) => handleSubstitute(ex.id)}
        title="Sustituir por..."
        suggested={substituteSuggestions}
        injuries={injuries}
      />

      <EditExerciseModal
        planExercise={editingExercise}
        onClose={() => setEditingExercise(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}

function EditExerciseModal({
  planExercise,
  onClose,
  onSave,
}: {
  planExercise: PlanExercise | null;
  onClose: () => void;
  onSave: (sets: number, reps: string, rest: number, notes: string) => void;
}) {
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState("12");
  const [rest, setRest] = useState(60);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (planExercise) {
      setSets(planExercise.sets);
      setReps(planExercise.reps);
      setRest(planExercise.rest_seconds);
      setNotes(planExercise.notes ?? "");
    }
  }, [planExercise]);

  return (
    <Modal open={!!planExercise} onClose={onClose} title="Editar ejercicio">
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-heading text-bubble-500">Series</label>
            <input
              type="number"
              min={1}
              value={sets}
              onChange={(e) => setSets(Number(e.target.value))}
              className="mt-1 w-full rounded-2xl border border-bubble-200 px-4 py-2.5 outline-none focus:border-bubble-400"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-heading text-bubble-500">Reps</label>
            <input
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="12 o 20 min"
              className="mt-1 w-full rounded-2xl border border-bubble-200 px-4 py-2.5 outline-none focus:border-bubble-400"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-heading text-bubble-500">Descanso (segundos)</label>
          <input
            type="number"
            min={0}
            value={rest}
            onChange={(e) => setRest(Number(e.target.value))}
            className="mt-1 w-full rounded-2xl border border-bubble-200 px-4 py-2.5 outline-none focus:border-bubble-400"
          />
        </div>
        <div>
          <label className="text-xs font-heading text-bubble-500">Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="ej: cuidado con el codo..."
            className="mt-1 w-full rounded-2xl border border-bubble-200 px-4 py-2.5 outline-none focus:border-bubble-400 resize-none"
          />
        </div>
        <button
          onClick={() => onSave(sets, reps, rest, notes)}
          className="btn-kawaii py-3 font-semibold"
        >
          Guardar
        </button>
      </div>
    </Modal>
  );
}
