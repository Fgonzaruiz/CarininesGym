import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Exercise } from "../types/exercise";
import { BODY_PARTS, bodyPartLabel, searchExercises } from "../lib/exercises";
import Modal from "./Modal";
import ExerciseCard from "./ExerciseCard";

export default function ExercisePickerModal({
  open,
  onClose,
  exercises,
  onPick,
  title = "Elige un ejercicio",
  suggested,
}: {
  open: boolean;
  onClose: () => void;
  exercises: Exercise[];
  onPick: (exercise: Exercise) => void;
  title?: string;
  suggested?: Exercise[];
}) {
  const [query, setQuery] = useState("");
  const [bodyPart, setBodyPart] = useState("");

  const results = useMemo(
    () => searchExercises(exercises, query, { bodyPart: bodyPart || undefined }).slice(0, 60),
    [exercises, query, bodyPart]
  );

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-3">
        {suggested && suggested.length > 0 && !query && !bodyPart && (
          <div>
            <p className="font-heading text-xs text-pinky-500 mb-2">
              Gemelos ideales para sustituir
            </p>
            <div className="flex flex-col gap-2 mb-3">
              {suggested.slice(0, 5).map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} onClick={() => onPick(ex)} />
              ))}
            </div>
            <div className="h-px bg-bubble-100 my-1" />
          </div>
        )}

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bubble-300"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca un ejercicio..."
            className="w-full rounded-full border border-bubble-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-bubble-400 bg-white"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setBodyPart("")}
            className={`chip shrink-0 border ${
              bodyPart === ""
                ? "bg-bubble-500 text-white border-bubble-500"
                : "bg-white text-bubble-400 border-bubble-200"
            }`}
          >
            Todos
          </button>
          {BODY_PARTS.map((bp) => (
            <button
              key={bp}
              onClick={() => setBodyPart(bp)}
              className={`chip shrink-0 border ${
                bodyPart === bp
                  ? "bg-bubble-500 text-white border-bubble-500"
                  : "bg-white text-bubble-400 border-bubble-200"
              }`}
            >
              {bodyPartLabel(bp)}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 max-h-[45vh] overflow-y-auto pr-1">
          {results.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} onClick={() => onPick(ex)} />
          ))}
          {results.length === 0 && (
            <p className="text-center text-sm text-bubble-400 py-6">
              No encontré nada por ahí, prueba otra palabra
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
