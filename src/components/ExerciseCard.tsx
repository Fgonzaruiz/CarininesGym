import type { Exercise } from "../types/exercise";
import { bodyPartLabel } from "../lib/exercises";

export default function ExerciseCard({
  exercise,
  onClick,
  right,
}: {
  exercise: Exercise;
  onClick?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="kawaii-card w-full flex items-center gap-3 p-2.5 text-left active:scale-[0.98] transition"
    >
      <img
        src={`${import.meta.env.BASE_URL}${exercise.image ?? ""}`}
        alt={exercise.name}
        loading="lazy"
        className="w-14 h-14 rounded-2xl object-cover bg-bubble-50 border border-bubble-100 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-heading text-sm text-bubble-700 capitalize truncate">
          {exercise.name}
        </p>
        <div className="flex gap-1 mt-1 flex-wrap">
          <span className="chip bg-sky-glow-100 text-sky-glow-500">
            {bodyPartLabel(exercise.body_part)}
          </span>
          <span className="chip bg-pinky-100 text-pinky-500 capitalize">
            {exercise.equipment}
          </span>
        </div>
      </div>
      {right}
    </button>
  );
}
