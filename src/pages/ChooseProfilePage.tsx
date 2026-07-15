import { CARININES, CARININE_ORDER, type CarinineId } from "../types/profile";
import { useProfileStore } from "../store/profileStore";
import { isSupabaseConfigured } from "../lib/supabase";

function CarinineAvatar({ id }: { id: CarinineId }) {
  const isKnifey = id === "Knifey";
  return (
    <div
      className={`w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-heading text-white border-4 shrink-0 ${
        isKnifey
          ? "bg-gradient-to-br from-psychic-400 to-psychic-700 border-psychic-300"
          : "bg-gradient-to-br from-meadow-400 to-meadow-700 border-meadow-300"
      }`}
      style={{ boxShadow: "inset 0 2px 0 rgba(255,255,255,0.4), 0 4px 0 rgba(0,0,0,0.15)" }}
    >
      {isKnifey ? "K" : "F"}
    </div>
  );
}

export default function ChooseProfilePage() {
  const setProfile = useProfileStore((s) => s.setProfile);

  return (
    <div className="game-bg min-h-screen flex items-center justify-center px-5 py-10 star-pattern">
      <div className="w-full max-w-md pop-in">
        <div className="poke-panel p-6 mb-6 text-center">
          <p className="text-xs font-heading uppercase tracking-widest text-poke-blue-600 mb-1">
            Region Cariñines
          </p>
          <h1 className="font-heading text-4xl game-title">CariñinesGym</h1>
          <p className="text-wood-600 font-heading text-lg mt-3">
            Que carinin eres?
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="stardew-panel p-4 mb-5 text-sm text-wood-600">
            Conecta Supabase en <code>.env.local</code> para guardar entrenos en la nube.
          </div>
        )}

        <div className="flex flex-col gap-4">
          {CARININE_ORDER.map((id) => {
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
                  <p className="font-heading text-xl text-wood-700">{c.label}</p>
                  <p className="text-xs text-wood-500 mt-1 leading-snug">{c.description}</p>
                  <span
                    className={`chip inline-block mt-2 ${
                      isKnifey
                        ? "bg-psychic-100 text-psychic-700 border-psychic-300"
                        : "bg-meadow-100 text-meadow-700 border-meadow-300"
                    }`}
                  >
                    {c.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-wood-500 mt-8 px-4">
          Elige quien usa la app en este dispositivo. Cada perfil guarda su progreso por separado.
        </p>
      </div>
    </div>
  );
}
