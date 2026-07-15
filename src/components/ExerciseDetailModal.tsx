import type { Exercise } from "../types/exercise";
import { bodyPartLabel } from "../lib/exercises";
import Modal from "./Modal";

export default function ExerciseDetailModal({
  exercise,
  open,
  onClose,
  footer,
}: {
  exercise: Exercise | null;
  open: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  if (!exercise) return null;
  return (
    <Modal open={open} onClose={onClose} title={exercise.name}>
      <div className="flex flex-col gap-4">
        <img
          src={`${import.meta.env.BASE_URL}${exercise.gif ?? exercise.image ?? ""}`}
          alt={exercise.name}
          className="w-full max-w-[220px] mx-auto rounded-2xl border border-bubble-100 bg-bubble-50"
        />

        <div className="flex gap-1.5 flex-wrap justify-center">
          <span className="chip bg-sky-glow-100 text-sky-glow-500">
            {bodyPartLabel(exercise.body_part)}
          </span>
          <span className="chip bg-bubble-100 text-bubble-600 capitalize">
            Objetivo: {exercise.target}
          </span>
          <span className="chip bg-pinky-100 text-pinky-500 capitalize">
            {exercise.equipment}
          </span>
        </div>

        {exercise.secondary_muscles.length > 0 && (
          <p className="text-xs text-center text-bubble-400">
            También trabaja: {exercise.secondary_muscles.join(", ")}
          </p>
        )}

        {exercise.steps_es.length > 0 ? (
          <div>
            <p className="font-heading text-sm text-bubble-700 mb-2">Cómo se hace</p>
            <ol className="flex flex-col gap-2">
              {exercise.steps_es.map((step, i) => (
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
          <p className="text-sm text-bubble-500">{exercise.instructions_es}</p>
        )}

        <p className="text-[10px] text-center text-bubble-300">{exercise.attribution}</p>

        {footer}
      </div>
    </Modal>
  );
}
