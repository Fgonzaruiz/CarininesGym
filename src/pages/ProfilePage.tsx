import { useState } from "react";
import { UserRound, LogOut } from "lucide-react";
import { useProfileStore } from "../store/profileStore";

export default function ProfilePage() {
  const { name, setName, clear } = useProfileStore();
  const [input, setInput] = useState(name ?? "");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!input.trim()) return;
    setName(input.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleSwitchProfile() {
    if (!confirm("¿Cambiar de persona en este dispositivo?")) return;
    clear();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl text-bubble-700">Tu perfil</h1>

      <div className="kawaii-card p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-bubble-50 flex items-center justify-center mx-auto mb-2">
          <UserRound size={28} className="text-bubble-500" />
        </div>
        <p className="font-heading text-lg text-bubble-700">{name}</p>
      </div>

      <div className="kawaii-card p-5">
        <label className="text-xs font-heading text-bubble-500">Nombre</label>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-bubble-200 px-4 py-2.5 outline-none focus:border-bubble-400"
        />
        <button
          onClick={handleSave}
          className="btn-kawaii w-full py-2.5 mt-3 text-sm font-semibold"
        >
          {saved ? "Guardado" : "Guardar cambios"}
        </button>
      </div>

      <button
        onClick={handleSwitchProfile}
        className="flex items-center justify-center gap-2 py-3 rounded-full border-2 border-pinky-200 text-pinky-500 font-heading"
      >
        <LogOut size={16} /> Cambiar de persona
      </button>

      <p className="text-center text-[11px] text-bubble-300 mt-4">
        Datos de ejercicios © Gym visual · gymvisual.com
      </p>
    </div>
  );
}
