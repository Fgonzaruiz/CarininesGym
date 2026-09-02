import { useState } from "react";
import { Dumbbell, Flame, Zap, HeartPulse, CheckCircle2 } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { SESSION_TYPE_INFO } from "../lib/sessionTypes";
import { SESSION_TYPES, type SessionType } from "../types/plan";
import { quickLogSession } from "../lib/sessionsApi";
import { describeError } from "../lib/errors";
import Modal from "./Modal";
import TabataTimer from "./TabataTimer";

const TYPE_ICONS: Record<SessionType, typeof Dumbbell> = {
  fuerza: Dumbbell,
  tabata: Flame,
  hybrid: Zap,
  cardio: HeartPulse,
};

export default function QuickLogModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const name = useProfileStore((s) => s.name);
  const [type, setType] = useState<SessionType>("tabata");
  const [rounds, setRounds] = useState(8);
  const [work, setWork] = useState(20);
  const [rest, setRest] = useState(10);
  const [duration, setDuration] = useState(
    String(SESSION_TYPE_INFO.tabata.defaultDurationMinutes)
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabataDone, setTabataDone] = useState(false);

  function handleTypeChange(t: SessionType) {
    setType(t);
    setDuration(String(SESSION_TYPE_INFO[t].defaultDurationMinutes));
    setTabataDone(false);
    setError(null);
  }

  function handleTabataComplete(totalSeconds: number) {
    setTabataDone(true);
    const mins = Math.max(1, Math.round(totalSeconds / 60));
    setDuration(String(mins));
  }

  async function handleSave() {
    if (!name || saving) return;
    setSaving(true);
    setError(null);
    try {
      const dur = duration.trim() ? Number(duration) : null;
      await quickLogSession(name, {
        session_type: type,
        duration_minutes: dur && dur > 0 ? Math.round(dur) : null,
        notes: notes.trim() || null,
      });
      setSaved(true);
      onSaved?.();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    onClose();
    // Reset para la próxima vez
    setTimeout(() => {
      setSaved(false);
      setTabataDone(false);
      setError(null);
      setNotes("");
      setType("tabata");
      setDuration(String(SESSION_TYPE_INFO.tabata.defaultDurationMinutes));
    }, 200);
  }

  return (
    <Modal open={open} onClose={handleClose} title="Día libre / entreno especial">
      {saved ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 size={48} className="text-meadow-500" />
          <p className="font-heading text-gray-800">
            {SESSION_TYPE_INFO[type].label} registrado en tu historial
          </p>
          <p className="text-sm text-gray-500">
            {duration.trim() && Number(duration) > 0 ? `${duration} min` : ""}
            {notes.trim() ? ` · ${notes.trim()}` : ""}
          </p>
          <button onClick={handleClose} className="btn-kawaii px-6 py-2.5 text-sm font-semibold">
            Listo
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-heading text-bubble-500 mb-2">¿Qué hiciste hoy?</p>
            <div className="grid grid-cols-2 gap-2">
              {SESSION_TYPES.map((t) => {
                const Icon = TYPE_ICONS[t];
                const active = type === t;
                return (
                  <button
                    key={t}
                    onClick={() => handleTypeChange(t)}
                    className={`rounded-2xl border-2 p-3 text-left transition ${
                      active
                        ? `${SESSION_TYPE_INFO[t].chipClass} border-transparent`
                        : "bg-white border-bubble-100 text-gray-500"
                    }`}
                  >
                    <Icon size={18} className={active ? "" : "text-bubble-300"} />
                    <p className="font-heading text-sm mt-1.5">{SESSION_TYPE_INFO[t].label}</p>
                    <p className="text-[10px] leading-snug mt-0.5 opacity-80">
                      {SESSION_TYPE_INFO[t].description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {(type === "tabata" || type === "hybrid") && (
            <div className="flex flex-col gap-2.5">
              <p className="text-xs font-heading text-bubble-500">
                Timer de Tabata (20s a tope / 10s descanso)
              </p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-bubble-400 block">Rondas</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={rounds}
                    onChange={(e) => setRounds(Math.max(1, Number(e.target.value)))}
                    className="mt-0.5 w-full rounded-xl border border-bubble-200 px-3 py-2 text-sm text-center outline-none focus:border-bubble-400 bg-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-bubble-400 block">Trabajo (s)</label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={work}
                    onChange={(e) => setWork(Math.max(5, Number(e.target.value)))}
                    className="mt-0.5 w-full rounded-xl border border-bubble-200 px-3 py-2 text-sm text-center outline-none focus:border-bubble-400 bg-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-bubble-400 block">Descanso (s)</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={rest}
                    onChange={(e) => setRest(Math.max(5, Number(e.target.value)))}
                    className="mt-0.5 w-full rounded-xl border border-bubble-200 px-3 py-2 text-sm text-center outline-none focus:border-bubble-400 bg-white"
                  />
                </div>
              </div>
              <TabataTimer
                rounds={rounds}
                workSeconds={work}
                restSeconds={rest}
                onComplete={handleTabataComplete}
              />
              {tabataDone && (
                <p className="text-[11px] font-heading text-meadow-600">
                  Timer completado · duración calculada automáticamente
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-bubble-400 block">Duración (minutos)</label>
              <input
                inputMode="numeric"
                value={duration}
                onChange={(e) => setDuration(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="30"
                className="mt-0.5 w-full rounded-xl border border-bubble-200 px-3 py-2 text-sm text-center outline-none focus:border-bubble-400 bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-bubble-400 block">Notas (opcional)</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ej: 8 rondas + core"
                className="mt-0.5 w-full rounded-xl border border-bubble-200 px-3 py-2 text-sm outline-none focus:border-bubble-400 bg-white"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-pinky-50 border-2 border-pinky-200 p-3">
              <p className="text-sm font-heading text-pinky-600">
                No se ha podido guardar el entreno.
              </p>
              <p className="text-xs text-gray-500 mt-1 break-words">{error}</p>
              <p className="text-xs text-gray-400 mt-1">
                Revisa tu conexión y pulsa de nuevo en "Guardar entreno".
              </p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-kawaii py-3 font-semibold disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar entreno"}
          </button>
        </div>
      )}
    </Modal>
  );
}
