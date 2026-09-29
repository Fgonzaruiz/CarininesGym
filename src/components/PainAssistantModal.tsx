import { useEffect, useState } from "react";
import { Bot, Loader2, AlertTriangle, Check, ArrowRight, ShieldCheck, Repeat, MessageCircleMore } from "lucide-react";
import Modal from "./Modal";
import type { Exercise } from "../types/exercise";
import type { PlanExercise } from "../types/plan";
import type { InjuryId } from "../lib/injuries";
import { injuryLabel } from "../lib/injuries";
import { findSafeAlternatives, unsafeReasonsFor } from "../lib/injuries";
import { useProfileStore } from "../store/profileStore";
import { usePlansStore } from "../store/plansStore";
import * as plansApi from "../lib/plansApi";
import * as assistantApi from "../lib/assistantApi";
import type { CandidateBrief, DayExerciseBrief } from "../lib/assistantApi";
import { describeError } from "../lib/errors";

type Phase = "input" | "analyzing" | "proposal" | "empty" | "done";

interface SubstitutionProposal {
  pe: PlanExercise;
  oldExercise: Exercise;
  newExercise: Exercise;
  reason: string;
}

interface Proposal {
  injuries: InjuryId[];
  explanation: string;
  substitutions: SubstitutionProposal[];
}

const EXAMPLES = [
  "Me duele la rodilla al hacer sentadillas",
  "Me molesta el hombro con los presses",
  "Me duele la espalda baja",
];

function toBrief(pe: PlanExercise, ex: Exercise): DayExerciseBrief {
  return {
    peId: pe.id,
    exerciseId: ex.id,
    name: ex.name,
    bodyPart: ex.body_part,
    equipment: ex.equipment,
    target: ex.target,
  };
}

export default function PainAssistantModal({
  open,
  onClose,
  dayName,
  exercises,
  dayExercises,
  injuries,
}: {
  open: boolean;
  onClose: () => void;
  dayName: string;
  exercises: Exercise[];
  dayExercises: PlanExercise[];
  injuries: InjuryId[];
}) {
  const name = useProfileStore((s) => s.name);
  const refresh = usePlansStore((s) => s.refresh);

  const [phase, setPhase] = useState<Phase>("input");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Al abrirlo, empezar de cero
  useEffect(() => {
    if (open) {
      setPhase("input");
      setMessage("");
      setError(null);
      setProposal(null);
      setApplying(false);
      setApplyError(null);
    }
  }, [open]);

  async function analyze() {
    const text = message.trim();
    if (!text || phase === "analyzing") return;
    setPhase("analyzing");
    setError(null);
    setApplyError(null);

    try {
      // Paso 1: el modelo interpreta la molestia -> zonas doloridas
      const detected = await assistantApi.detectInjuries(text);

      if (detected.injuries.length === 0) {
        setProposal({
          injuries: [],
          explanation: detected.explanation,
          substitutions: [],
        });
        setPhase("empty");
        return;
      }

      // Zonas afectadas = las que ya tenía + las nuevas
      const combined = [...new Set([...injuries, ...detected.injuries])];

      // Paso 2: ejercicios del día que cargan esa zona y sustitutos seguros
      const substitutions: SubstitutionProposal[] = [];
      for (const pe of dayExercises) {
        const ex = exercises.find((e) => e.id === pe.exercise_id);
        if (!ex) continue;
        if (unsafeReasonsFor(ex, combined).length === 0) continue;

        const candidates: CandidateBrief[] = findSafeAlternatives(
          exercises,
          ex,
          combined,
          8
        ).map((e) => ({ id: e.id, name: e.name }));
        if (candidates.length === 0) continue;

        let pick: assistantApi.PickResult;
        try {
          pick = await assistantApi.pickSubstitute(text, toBrief(pe, ex), candidates);
        } catch {
          pick = {
            exerciseId: candidates[0].id,
            reason: "Mejor opción segura disponible.",
          };
        }
        const chosen =
          exercises.find((e) => e.id === pick.exerciseId) ??
          exercises.find((e) => e.id === candidates[0].id);
        if (!chosen) continue;

        substitutions.push({ pe, oldExercise: ex, newExercise: chosen, reason: pick.reason });
      }

      setProposal({
        injuries: detected.injuries,
        explanation: detected.explanation,
        substitutions,
      });
      setPhase("proposal");
    } catch (err) {
      setError(describeError(err));
      setPhase("input");
    }
  }

  async function apply() {
    if (!proposal || applying) return;
    setApplying(true);
    setApplyError(null);

    try {
      // Añade las molestias nuevas al perfil
      const profile = useProfileStore.getState();
      for (const id of proposal.injuries) {
        if (!profile.injuries.includes(id)) profile.toggleInjury(id);
      }
      // Sustituye los ejercicios del plan en Supabase
      for (const sub of proposal.substitutions) {
        await plansApi.substituteExercise(
          sub.pe.id,
          sub.oldExercise.id,
          sub.newExercise.id,
          sub.pe.original_exercise_id
        );
      }
      if (name) await refresh(name);
      setPhase("done");
    } catch (err) {
      setApplyError(describeError(err));
      setApplying(false);
    }
  }

  const newInjuryCount =
    proposal?.injuries.filter((id) => !injuries.includes(id)).length ?? 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Asistente de molestias · ${dayName}`}
    >
      {phase === "input" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600 leading-relaxed">
            Cuéntame qué te duele o qué te molesta y adaptaré el entreno de hoy:
            añado la molestia a tu perfil y sustituyo los ejercicios que la cargan
            por alternativas seguras. Tú decides antes de aplicar nada.
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="P. ej.: me duele la rodilla al hacer sentadillas"
            className="w-full rounded-xl border border-bubble-200 px-3 py-2.5 text-sm outline-none focus:border-bubble-400 bg-white resize-none"
          />
          <div className="flex gap-1.5 flex-wrap">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setMessage(ex)}
                className="chip shrink-0 border border-bubble-200 bg-white text-bubble-500 text-[11px]"
              >
                {ex}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border-2 border-pinky-200 bg-pinky-50/60 px-3 py-2.5 text-pinky-600">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed break-words">{error}</p>
            </div>
          )}

          <button
            onClick={() => void analyze()}
            disabled={!message.trim()}
            className="game-btn py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Bot size={18} /> Analizar molestia
          </button>
        </div>
      )}

      {phase === "analyzing" && (
        <div className="py-10 flex flex-col items-center gap-4 text-center">
          <Loader2 className="animate-spin text-poke-blue-500" size={36} />
          <p className="font-heading text-wood-600 text-sm">
            Preguntando al entrenador IA…
          </p>
          <p className="text-xs text-gray-400 max-w-xs">
            Detecta la molestia y revisa los {dayExercises.length} ejercicios de
            hoy buscando sustitutos seguros.
          </p>
        </div>
      )}

      {phase === "empty" && proposal && (
        <div className="flex flex-col gap-4 items-center text-center py-6">
          <MessageCircleMore size={40} className="text-bubble-400" />
          <p className="font-heading text-wood-600">No detecté molestias claras</p>
          {proposal.explanation && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {proposal.explanation}
            </p>
          )}
          <button
            onClick={() => setPhase("input")}
            className="btn-kawaii px-5 py-2.5 text-sm font-semibold"
          >
            Volver a intentar
          </button>
        </div>
      )}

      {phase === "proposal" && proposal && (
        <div className="flex flex-col gap-4">
          {proposal.explanation && (
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-heading text-meadow-700">He entendido: </span>
              {proposal.explanation}
            </p>
          )}

          {proposal.injuries.length > 0 && (
            <div className="rounded-xl border-2 border-meadow-200 bg-meadow-50/70 p-3">
              <p className="text-xs font-heading text-meadow-700 mb-2">
                {newInjuryCount > 0
                  ? "Añadiré a tu perfil:"
                  : "Ya tenías marcado en tu perfil:"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {proposal.injuries.map((id) => (
                  <span
                    key={id}
                    className="chip border border-meadow-300 bg-white text-meadow-700"
                  >
                    <ShieldCheck size={12} className="inline -mt-0.5 mr-1" />
                    {injuryLabel(id)}
                    {!injuries.includes(id) && (
                      <span className="text-meadow-400"> · nuevo</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {proposal.substitutions.length === 0 ? (
            <div className="rounded-xl border-2 border-bubble-200 bg-white p-3">
              <p className="text-sm text-gray-600">
                Ningún ejercicio de hoy carga esa zona: no necesito sustituir nada.
                ¿Aplico solo el cambio del perfil?
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-heading text-wood-500">
                Sustituiré en el entreno de hoy ({proposal.substitutions.length}):
              </p>
              {proposal.substitutions.map((sub) => (
                <div key={sub.pe.id} className="rounded-xl border border-wood-200 bg-white p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <p className="text-gray-500 capitalize line-through decoration-pinky-300 decoration-2">
                      {sub.oldExercise.name}
                    </p>
                    <ArrowRight size={14} className="text-meadow-500 shrink-0" />
                    <p className="font-heading text-gray-800 capitalize">
                      {sub.newExercise.name}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    {sub.reason}
                  </p>
                </div>
              ))}
            </div>
          )}

          {applyError && (
            <div className="flex items-start gap-2 rounded-xl border-2 border-pinky-200 bg-pinky-50/60 px-3 py-2.5 text-pinky-600">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed break-words">{applyError}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setPhase("input")}
              disabled={applying}
              className="flex-1 py-3 rounded-full border-2 border-wood-200 text-wood-700 font-heading disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => void apply()}
              disabled={applying}
              className="flex-[2] game-btn py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {applying && <Loader2 size={18} className="animate-spin" />}
              <Check size={18} /> Aplicar cambios
            </button>
          </div>
        </div>
      )}

      {phase === "done" && proposal && (
        <div className="flex flex-col gap-4 items-center text-center py-6">
          <span className="w-14 h-14 rounded-full bg-meadow-100 flex items-center justify-center">
            <Check size={28} className="text-meadow-600" />
          </span>
          <p className="font-heading text-wood-700 text-lg">¡Listo!</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            {newInjuryCount > 0 &&
              `${newInjuryCount === 1 ? "Molestia añadida" : `${newInjuryCount} molestias añadidas`} a tu perfil`}
            {newInjuryCount > 0 && proposal.substitutions.length > 0 && " y "}
            {proposal.substitutions.length > 0 &&
              `${proposal.substitutions.length === 1 ? "ejercicio sustituido" : `${proposal.substitutions.length} ejercicios sustituidos`} en el entreno de hoy`}
            {newInjuryCount === 0 && proposal.substitutions.length === 0 && "Todo en orden"}
            . Ya puedes seguir con el entreno: el plan de hoy está actualizado.
          </p>
          <button
            onClick={onClose}
            className="game-btn px-8 py-3 font-semibold"
          >
            Entendido
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400">
        <Repeat size={11} />
        Los cambios son propuestas del asistente IA: revisa antes de aplicar.
      </div>
    </Modal>
  );
}