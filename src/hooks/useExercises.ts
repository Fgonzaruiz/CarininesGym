import { useEffect, useState } from "react";
import type { Exercise } from "../types/exercise";
import { loadExercises } from "../lib/exercises";

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    loadExercises()
      .then((data) => {
        if (mounted) setExercises(data);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Error");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { exercises, loading, error };
}
