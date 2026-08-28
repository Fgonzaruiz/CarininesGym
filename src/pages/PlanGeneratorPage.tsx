import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wand2, Sparkles, AlertTriangle } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { usePlansStore } from "../store/plansStore";
import { useExercises } from "../hooks/useExercises";
import {
  generatePlanSeed,
  planWeekPreview,
  roleSessionType,
  FOCUSES,
  LEVELS,
  type FocusId,
  type LevelId,
} from "../lib/planGenerator";
import { INJURIES, type InjuryId } from "../lib/injuries";
import { SESSION_TYPE_INFO } from "../lib/sessionTypes";
import * as api from "../lib/plansApi";
import LoadingScreen from "../components/LoadingScreen";

const DAY_OPTIONS = [2, 3, 4, 5, 6];
const CLASS_OPTIONS = [0, 1, 2];

export default function PlanGeneratorPage() {
  const navigate = useNavigate();
  const name = useProfileStore((s) => s.name);
  const profileInjuries = useProfileStore((s) => s.injuries);
  const { exercises, loading: exercisesLoading } = useExercises();
  const refresh = usePlansStore((s) => s.refresh);

  const [planName, setPlanName] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [classDays, setClassDays] = useState(1);
  const [focus, setFocus] = useState<FocusId>("general");
  const [level, setLevel] = useState<LevelId>("intermedio");
  const [injuries, setInjuries] = useState<InjuryId[]>(profileInjuries);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxClassDays = Math.max(0, daysPerWeek - 1);
  const effectiveClassDays = Math.min(classDays, maxClassDays);

  const preview = useMemo(
    () => planWeekPreview(focus, daysPerWeek, effectiveClassDays),
    [focus, daysPerWeek, effectiveClassDays]
  );

  function toggleInjury(id: InjuryId) {
    setInjuries((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleGenerate() {
    if (!name || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const seed = generatePlanSeed(exercises, {
        planName,
        daysPerWeek,
        classDays: effectiveClassDays,
        focus,
        level,
        injuries,
      });
      const plan = await api.createGeneratedPlan(
        name,
        { name: seed.name, description: seed.description },
        seed.weeks.flat()
      );
      await refresh(name);
      navigate(`/planes/${plan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pude fabricar el plan. Inténtalo otra vez.");
    } finally {
      setGenerating(false);
    }
  }

  if (!name || exercisesLoading) {
    return <LoadingScreen label="Preparando el generador..." />;
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <button
        onClick={() => navigate("/planes")}
        className="flex items-center gap-1 text-sm text-bubble-400 font-heading self-start"
      >
        <ArrowLeft size={16} /> Planes
      </button>

      <div className="kawaii-card p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-psychic-50 flex items-center justify-center shrink-0">
            <Wand2 size={22} className="text-psychic-600" />
          </div>
          <div>
            <h1 className="font-heading text-xl text-bubble-700">Generador de planes</h1>
            <p className="text-sm text-bubble-400">
              Dime cuántos días quieres ir y qué te duele: te fabrico el mes entero
            </p>
          </div>
        </div>
      </div>

      <div className="kawaii-card p-4 flex flex-col gap-4">
        <div>
          <label className="text-xs font-heading text-bubble-500">Nombre del plan (opcional)</label>
          <input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="ej: Mi mes de fuego 🔥"
            className="mt-1 w-full rounded-2xl border border-bubble-200 px-4 py-2.5 outline-none focus:border-bubble-400"
          />
        </div>

        <div>
          <label className="text-xs font-heading text-bubble-500">Días por semana</label>
          <div className="flex gap-2 mt-1.5">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDaysPerWeek(d)}
                className={`flex-1 py-2.5 rounded-xl font-heading text-sm border-2 transition active:scale-95 ${
                  daysPerWeek === d
                    ? "bg-bubble-500 text-white border-bubble-600"
                    : "bg-white text-bubble-400 border-bubble-200"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-heading text-bubble-500">
            Días de clases (cardio · tabata · hybrid)
          </label>
          <div className="flex gap-2 mt-1.5">
            {CLASS_OPTIONS.map((c) => {
              const disabled = c > maxClassDays;
              return (
                <button
                  key={c}
                  disabled={disabled}
                  onClick={() => setClassDays(c)}
                  className={`flex-1 py-2.5 rounded-xl font-heading text-sm border-2 transition active:scale-95 disabled:opacity-40 ${
                    effectiveClassDays === c
                      ? "bg-pinky-500 text-white border-pinky-600"
                      : "bg-white text-bubble-400 border-bubble-200"
                  }`}
                >
                  {c === 0 ? "Ninguna" : c === 1 ? "1 · Cardio" : "2 · +Tabata"}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-heading text-bubble-500">Enfoque</label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            {FOCUSES.map((f) => (
              <button
                key={f.id}
                onClick={() => setFocus(f.id)}
                className={`rounded-xl border-2 px-3 py-2 text-left transition active:scale-[0.98] ${
                  focus === f.id
                    ? "bg-meadow-100 border-meadow-400"
                    : "bg-white border-bubble-200"
                }`}
              >
                <p className={`font-heading text-sm ${focus === f.id ? "text-meadow-800" : "text-bubble-600"}`}>
                  {f.label}
                </p>
                <p className="text-[10px] text-bubble-400 mt-0.5">{f.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-heading text-bubble-500">Nivel</label>
          <div className="flex gap-2 mt-1.5">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={`flex-1 rounded-xl border-2 px-2 py-2 text-center transition active:scale-95 ${
                  level === l.id
                    ? "bg-sky-glow-100 border-sky-glow-400"
                    : "bg-white border-bubble-200"
                }`}
              >
                <p className={`font-heading text-sm ${level === l.id ? "text-sky-glow-700" : "text-bubble-600"}`}>
                  {l.label}
                </p>
                <p className="text-[10px] text-bubble-400 mt-0.5">{l.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-heading text-bubble-500">
            ¿Te duele algo? Los ejercicios que lo carguen se descartan
          </label>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {INJURIES.map((inj) => {
              const active = injuries.includes(inj.id);
              return (
                <button
                  key={inj.id}
                  onClick={() => toggleInjury(inj.id)}
                  className={`chip border transition active:scale-95 ${
                    active
                      ? "bg-pinky-100 text-pinky-700 border-pinky-300"
                      : "bg-white text-bubble-400 border-bubble-200"
                  }`}
                >
                  {inj.label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-bubble-300 mt-1">
            {injuries.length > 0
              ? `Filtraré por: ${injuries
                  .map((i) => INJURIES.find((x) => x.id === i)?.label)
                  .join(", ")}`
              : "Sin molestias marcadas: el plan usará el catálogo completo"}
          </p>
        </div>
      </div>

      <div className="kawaii-card p-4">
        <p className="text-xs font-heading text-bubble-500 mb-2">Así quedará tu semana tipo</p>
        <div className="flex flex-wrap gap-1.5">
          {preview.map((day, i) => {
            const type = roleSessionType(day.role);
            const info = SESSION_TYPE_INFO[type];
            return (
              <span
                key={i}
                className={`chip border ${info.chipClass} border-transparent`}
              >
                {day.name}
              </span>
            );
          })}
        </div>
        <p className="text-[11px] text-bubble-400 mt-2">
          4 semanas con este esquema · las semanas 3-4 suben series y bajan descansos
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border-2 border-pinky-200 bg-pinky-50 px-3 py-2.5 text-sm text-pinky-600">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="btn-kawaii py-4 font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {generating ? (
          <>
            <Sparkles size={20} className="animate-pulse" /> Fabricando tu plan...
          </>
        ) : (
          <>
            <Sparkles size={20} /> Fabricar mi plan mensual
          </>
        )}
      </button>
    </div>
  );
}
