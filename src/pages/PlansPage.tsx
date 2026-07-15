import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ChevronRight, Crown, Dumbbell, Trash2 } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { usePlansStore } from "../store/plansStore";
import * as api from "../lib/plansApi";
import LoadingScreen from "../components/LoadingScreen";
import Modal from "../components/Modal";

export default function PlansPage() {
  const name = useProfileStore((s) => s.name);
  const { plans, loading, fetch, refresh } = usePlansStore();
  const [creating, setCreating] = useState(false);
  const [planName, setPlanName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (name) fetch(name);
  }, [name, fetch]);

  async function handleCreate() {
    if (!name || !planName.trim()) return;
    setSaving(true);
    try {
      await api.createPlan(name, { name: planName.trim(), description });
      setCreating(false);
      setPlanName("");
      setDescription("");
      await refresh(name);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(planId: string, planName: string) {
    if (!name) return;
    if (!confirm(`Borrar el plan "${planName}"? Se eliminara con todos sus dias.`)) return;
    setDeletingId(planId);
    try {
      await api.deletePlan(planId);
      await refresh(name);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading && plans.length === 0) return <LoadingScreen label="Buscando tus planes..." />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-bubble-700">Tus planes</h1>
          <p className="text-sm text-bubble-400">Crea, edita y sustituye a tu gusto</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="btn-kawaii p-3 rounded-full"
          aria-label="Crear plan"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="kawaii-card p-4 flex items-center gap-3"
          >
            <Link
              to={`/planes/${plan.id}`}
              className="flex items-center gap-3 flex-1 min-w-0 active:scale-[0.98] transition"
            >
              <div className="w-11 h-11 rounded-2xl bg-bubble-50 flex items-center justify-center shrink-0">
                <Dumbbell size={20} className="text-bubble-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-heading text-bubble-700">{plan.name}</p>
                  {plan.is_default && (
                    <span className="chip bg-pinky-100 text-pinky-500 flex items-center gap-1">
                      <Crown size={10} /> default
                    </span>
                  )}
                </div>
                <p className="text-xs text-bubble-400 line-clamp-1">{plan.description}</p>
                <p className="text-[11px] text-bubble-300 mt-0.5">{plan.days.length} días</p>
              </div>
              <ChevronRight size={18} className="text-bubble-300 shrink-0" />
            </Link>
            <button
              onClick={() => handleDelete(plan.id, plan.name)}
              disabled={deletingId === plan.id}
              className="p-2.5 rounded-xl border-2 border-pinky-200 text-pinky-500 shrink-0 active:scale-95 disabled:opacity-50"
              aria-label={`Borrar plan ${plan.name}`}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        {plans.length === 0 && (
          <div className="kawaii-card p-8 text-center">
            <p className="text-bubble-500 font-heading">Todavía no tienes planes</p>
            <p className="text-sm text-bubble-400 mt-1">Crea el primero</p>
          </div>
        )}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo plan">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-heading text-bubble-500">Nombre del plan</label>
            <input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="ej: Fase Barbie Fitness"
              className="mt-1 w-full rounded-2xl border border-bubble-200 px-4 py-2.5 outline-none focus:border-bubble-400"
            />
          </div>
          <div>
            <label className="text-xs font-heading text-bubble-500">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="cuéntanos de qué va este plan..."
              rows={3}
              className="mt-1 w-full rounded-2xl border border-bubble-200 px-4 py-2.5 outline-none focus:border-bubble-400 resize-none"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={saving || !planName.trim()}
            className="btn-kawaii py-3 font-semibold disabled:opacity-60 mt-1"
          >
            {saving ? "Creando..." : "Crear plan"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
