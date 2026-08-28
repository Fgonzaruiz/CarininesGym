import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";
import type { Exercise } from "../types/exercise";
import type { InjuryId } from "../lib/injuries";
import { bodyPartLabel } from "../lib/exercises";
import {
  unsafeReasonsFor,
  findSafeAlternatives,
  unsafeEquipmentHint,
} from "../lib/injuries";
import { muscleKeyForTarget, MUSCLE_LABELS, type MuscleKey } from "../lib/muscleMap";
import Modal from "./Modal";

export default function ExerciseDetailModal({
  exercise,
  open,
  onClose,
  footer,
  exercises,
  injuries,
}: {
  exercise: Exercise | null;
  open: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
  /** Catálogo completo, necesario para sugerir alternativas seguras */
  exercises?: Exercise[];
  /** Lesiones activas del perfil */
  injuries?: InjuryId[];
}) {
  const [viewing, setViewing] = useState<Exercise | null>(exercise);

  useEffect(() => {
    setViewing(exercise);
  }, [exercise]);

  if (!viewing) return null;

  const showAlternatives = Boolean(exercises && exercises.length && injuries && injuries.length > 0);
  const reasons = showAlternatives ? unsafeReasonsFor(viewing, injuries!) : [];
  const alternatives =
    showAlternatives && reasons.length > 0
      ? findSafeAlternatives(exercises!, viewing, injuries!, 4)
      : [];
  const isAlternative = viewing.id !== exercise?.id;

  /** Grupos musculares secundarios mapeados al vocabulario del mapa muscular. */
  const secondaryGroups: MuscleKey[] = Array.from(
    new Set(
      viewing.secondary_muscles
        .map((m) => muscleKeyForTarget(m))
        .filter((k): k is MuscleKey => k !== null)
    )
  );

  return (
    <Modal open={open} onClose={onClose} title={viewing.name}>
      <div className="flex flex-col gap-4">
        {isAlternative && (
          <button
            onClick={() => setViewing(exercise)}
            className="flex items-center gap-1 text-xs font-heading text-bubble-400 self-start"
          >
            <ArrowLeft size={14} /> Volver a {exercise?.name}
          </button>
        )}

        <img
          src={`${import.meta.env.BASE_URL}${viewing.gif ?? viewing.image ?? ""}`}
          alt={viewing.name}
          className="w-full max-w-[220px] mx-auto rounded-2xl border border-bubble-100 bg-bubble-50"
        />

        <div className="flex gap-1.5 flex-wrap justify-center">
          <span className="chip bg-sky-glow-100 text-sky-glow-500">
            {bodyPartLabel(viewing.body_part)}
          </span>
          <span className="chip bg-bubble-100 text-bubble-600 capitalize">
            Objetivo: {viewing.target}
          </span>
          <span className="chip bg-pinky-100 text-pinky-500 capitalize">
            {viewing.equipment}
          </span>
        </div>

        {(viewing.secondary_muscles.length > 0 || secondaryGroups.length > 0) && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-heading uppercase tracking-wide text-bubble-400 text-center">
              Músculos secundarios
            </p>
            {secondaryGroups.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 justify-center">
                {secondaryGroups.map((g) => (
                  <span
                    key={g}
                    className="chip bg-wood-50 text-wood-600 border border-wood-200"
                  >
                    {MUSCLE_LABELS[g]}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center text-bubble-400 capitalize">
                {viewing.secondary_muscles.join(", ")}
              </p>
            )}
          </div>
        )}

        {reasons.length > 0 && (
          <div className="rounded-2xl border-2 border-pinky-200 bg-pinky-50 p-3">
            <p className="flex items-start gap-2 text-sm font-heading text-pinky-600">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              Cuidado: este ejercicio {reasons.join(" y ")}
            </p>
            {alternatives.length > 0 && (
              <p className="text-xs text-pinky-500 mt-1.5">
                Alternativas seguras para tu {unsafeEquipmentHint(injuries!)} abajo ↓
              </p>
            )}
          </div>
        )}

        {viewing.steps_es.length > 0 ? (
          <div>
            <p className="font-heading text-sm text-bubble-700 mb-2">Cómo se hace</p>
            <ol className="flex flex-col gap-2">
              {viewing.steps_es.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-bubble-600">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-bubble-100 text-bubble-600 text-xs flex items-center justify-center font-heading">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="text-sm text-bubble-500">{viewing.instructions_es}</p>
        )}

        {alternatives.length > 0 && (
          <div className="rounded-2xl border-2 border-meadow-200 bg-meadow-50 p-3">
            <p className="font-heading text-sm text-meadow-700 mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={15} /> Alternativas que no te cargan la zona
            </p>
            <div className="flex flex-col gap-1.5">
              {alternatives.map((alt) => (
                <button
                  key={alt.id}
                  onClick={() => setViewing(alt)}
                  className="flex items-center gap-2.5 bg-white rounded-xl p-2 text-left active:scale-[0.98] transition"
                >
                  <img
                    src={`${import.meta.env.BASE_URL}${alt.image ?? ""}`}
                    alt={alt.name}
                    loading="lazy"
                    className="w-10 h-10 rounded-lg object-cover bg-bubble-50 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-heading text-xs text-bubble-700 capitalize truncate">
                      {alt.name}
                    </p>
                    <p className="text-[10px] text-bubble-400 capitalize">
                      {alt.equipment} · ver cómo se hace
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-center text-bubble-300">{viewing.attribution}</p>

        {footer}
      </div>
    </Modal>
  );
}
