import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useExercises } from "../hooks/useExercises";
import { BODY_PARTS, bodyPartLabel, searchExercises } from "../lib/exercises";
import ExerciseCard from "../components/ExerciseCard";
import ExerciseDetailModal from "../components/ExerciseDetailModal";
import LoadingScreen from "../components/LoadingScreen";
import type { Exercise } from "../types/exercise";

export default function ExerciseLibraryPage() {
  const { exercises, loading } = useExercises();
  const [query, setQuery] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [visibleCount, setVisibleCount] = useState(40);

  const results = useMemo(
    () => searchExercises(exercises, query, { bodyPart: bodyPart || undefined }),
    [exercises, query, bodyPart]
  );

  if (loading) return <LoadingScreen label="Cargando el catálogo de ejercicios..." />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl text-bubble-700">Ejercicios</h1>
        <p className="text-sm text-bubble-400">
          {exercises.length} ejercicios esperando por ti, reina
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bubble-300" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca por nombre, músculo..."
          className="w-full rounded-full border border-bubble-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-bubble-400 bg-white"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {results.slice(0, visibleCount).map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} onClick={() => setSelected(ex)} />
        ))}
      </div>

      {results.length === 0 && (
        <p className="text-center text-sm text-bubble-400 py-10">
          No hay nada por aquí todavía, prueba otra búsqueda
        </p>
      )}

      {visibleCount < results.length && (
        <button
          onClick={() => setVisibleCount((v) => v + 40)}
          className="btn-kawaii py-2.5 text-sm mx-auto px-6"
        >
          Ver más
        </button>
      )}

      <ExerciseDetailModal
        exercise={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
