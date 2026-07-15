import { useEffect, useState, type FormEvent } from "react";
import { useProfileStore } from "../store/profileStore";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export default function ChooseProfilePage() {
  const setName = useProfileStore((s) => s.setName);
  const [input, setInput] = useState("");
  const [existingNames, setExistingNames] = useState<string[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from("plans")
      .select("owner")
      .then(({ data }) => {
        if (!data) return;
        const names = Array.from(new Set(data.map((row) => row.owner))).filter(
          Boolean
        );
        setExistingNames(names);
      });
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (input.trim()) setName(input.trim());
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="font-heading text-3xl text-bubble-700">AppGym</h1>
          <p className="text-bubble-400 font-heading mt-1">
            Hora de entrenar, quien eres?
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="kawaii-card p-4 mb-4 text-sm text-pinky-500 bg-pinky-50/60">
            Todavia no conectaste Supabase. Copia <code>env.example</code> a{" "}
            <code>.env.local</code>, pon tus claves y reinicia el servidor.
          </div>
        )}

        <div className="kawaii-card p-6">
          {existingNames.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-heading text-bubble-500 mb-2">
                Ya usaron esta app
              </p>
              <div className="flex flex-wrap gap-2">
                {existingNames.map((n) => (
                  <button
                    key={n}
                    onClick={() => setName(n)}
                    className="chip bg-bubble-50 text-bubble-600 border border-bubble-200 px-4 py-2"
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="h-px bg-bubble-100 my-4" />
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-heading text-bubble-500">
                Tu nombre
              </label>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="ej: Lulu"
                autoFocus
                className="mt-1 w-full rounded-2xl border border-bubble-200 px-4 py-2.5 outline-none focus:border-bubble-400 bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim()}
              className="btn-kawaii mt-2 py-3 font-semibold disabled:opacity-60"
            >
              Empezar
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-bubble-300 mt-6">
          Sin contraseñas ni registro, solo para ti y tu gente.
        </p>
      </div>
    </div>
  );
}
