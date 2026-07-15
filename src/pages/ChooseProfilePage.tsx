import { CARININES, type CarinineId } from "../types/profile";
import { useProfileStore } from "../store/profileStore";
import { isSupabaseConfigured } from "../lib/supabase";

function CarinineAvatar({ id }: { id: CarinineId }) {
  const isKnifey = id === "Knifey";
  return (
    <div
      className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-heading text-white shadow-lg border-3 ${
        isKnifey
          ? "bg-gradient-to-br from-psychic-400 to-psychic-700 border-psychic-300"
          : "bg-gradient-to-br from-meadow-400 to-meadow-700 border-meadow-300"
      }`}
      style={{ borderWidth: 3 }}
    >
      {isKnifey ? "K" : "F"}
    </div>
  );
}

export default function ChooseProfilePage() {
  const setProfile = useProfileStore((s) => s.setProfile);

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 star-pattern">
      <div className="w-full max-w-md pop-in">
        <div className="text-center mb-8">
          <p className="text-xs font-heading uppercase tracking-widest text-meadow-600 mb-1">
            Bienvenida al gimnasio
          </p>
          <h1 className="font-heading text-4xl game-title">CariñinesGym</h1>
          <p className="text-wood-600 font-heading text-lg mt-3">
            Que carinin eres?
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="cozy-card p-4 mb-5 text-sm text-wood-700 bg-wood-50/80">
            Conecta Supabase en <code>.env.local</code> para guardar entrenos en la nube.
          </div>
        )}

        <div className="flex flex-col gap-4">
          {(Object.keys(CARININES) as CarinineId[]).map((id) => {
            const c = CARININES[id];
            const isKnifey = id === "Knifey";
            return (
              <button
                key={id}
                onClick={() => setProfile(id)}
                className={`cozy-card p-5 flex items-center gap-4 text-left w-full active:scale-[0.98] transition ${
                  isKnifey ? "knifey-card" : "forky-card"
                }`}
              >
                <CarinineAvatar id={id} />
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-xl text-gray-800">{c.label}</p>
                  <p className={`text-sm font-heading ${isKnifey ? "text-psychic-600" : "text-meadow-600"}`}>
                    {c.subtitle}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">{c.description}</p>
                  {isKnifey && (
                    <span className="chip inline-block mt-2 bg-psychic-100 text-psychic-700 border-psychic-200">
                      Fase Mewtwo incluida
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Sin contrasenas. Cada carinin tiene sus propios planes y evolucion.
        </p>
      </div>
    </div>
  );
}
