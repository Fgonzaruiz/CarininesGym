import { useProfileStore } from "../store/profileStore";
import { CARININES, type CarinineId } from "../types/profile";

export default function ProfilePage() {
  const { name, clear, setProfile } = useProfileStore();
  const profile = name ? CARININES[name] : null;

  function handleSwitch(id: CarinineId) {
    if (id === name) return;
    setProfile(id);
    window.location.hash = "#/";
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl game-title">Tu perfil</h1>

      {profile && (
        <div className={`cozy-card p-6 text-center ${name === "Knifey" ? "knifey-card" : "forky-card"}`}>
          <div
            className={`w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl font-heading text-white ${
              name === "Knifey"
                ? "bg-gradient-to-br from-psychic-400 to-psychic-700"
                : "bg-gradient-to-br from-meadow-400 to-meadow-700"
            }`}
          >
            {name === "Knifey" ? "K" : "F"}
          </div>
          <p className="font-heading text-xl text-gray-800">{profile.label}</p>
          <p className="text-sm text-gray-500">{profile.description}</p>
        </div>
      )}

      <div className="cozy-card p-5">
        <p className="text-xs font-heading text-gray-500 mb-3">Cambiar carinin</p>
        <div className="flex gap-3">
          {(Object.keys(CARININES) as CarinineId[]).map((id) => (
            <button
              key={id}
              onClick={() => handleSwitch(id)}
              className={`flex-1 py-3 rounded-xl font-heading text-sm border-2 transition ${
                name === id
                  ? id === "Knifey"
                    ? "bg-psychic-100 border-psychic-400 text-psychic-700"
                    : "bg-meadow-100 border-meadow-400 text-meadow-700"
                  : "bg-white border-wood-200 text-gray-500"
              }`}
            >
              {CARININES[id].label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          if (confirm("Volver a elegir carinin?")) clear();
        }}
        className="py-3 rounded-full border-2 border-wood-200 text-wood-700 font-heading text-sm"
      >
        Cerrar sesion de carinin
      </button>
    </div>
  );
}
