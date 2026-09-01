import { useEffect, useMemo, useState } from "react";
import { Apple, Ban, Droplets, Salad } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import {
  NUTRITION_SECTIONS,
  PROTEIN_GOAL,
  RULE_80_20,
  TOP_3_CINTURA,
  type NutritionSection,
} from "../data/nutrition";

const ACCENT = {
  green: {
    header: "text-meadow-700",
    badge: "bg-meadow-100 border-meadow-300 text-meadow-700",
    checked: "bg-meadow-500 border-meadow-500 text-white",
  },
  gold: {
    header: "text-amber-600",
    badge: "bg-amber-100 border-amber-300 text-amber-700",
    checked: "bg-amber-400 border-amber-400 text-white",
  },
  wood: {
    header: "text-wood-600",
    badge: "bg-wood-100 border-wood-300 text-wood-700",
    checked: "bg-wood-500 border-wood-500 text-white",
  },
  sky: {
    header: "text-sky-600",
    badge: "bg-sky-100 border-sky-300 text-sky-700",
    checked: "bg-sky-500 border-sky-500 text-white",
  },
  red: {
    header: "text-red-500",
    badge: "bg-red-100 border-red-200 text-red-500",
    checked: "bg-red-500 border-red-500 text-white",
  },
} as const;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function IncludeSection({ section }: { section: NutritionSection }) {
  const name = useProfileStore((s) => s.name);
  const storageKey = `nutrition_done_${name ?? "anon"}_${todayKey()}`;
  const [done, setDone] = useState<Set<string>>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      return new Set(Array.isArray(raw) ? raw : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...done]));
    } catch {
      // localStorage no disponible: seguimos sin persistir
    }
  }, [done, storageKey]);

  const toggle = (food: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(food)) next.delete(food);
      else next.add(food);
      return next;
    });
  };

  const a = ACCENT[section.accent];
  return (
    <div className="cozy-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2.5 h-2.5 rounded-full ${a.checked.split(" ")[0]}`} />
        <p className={`font-heading text-sm ${a.header}`}>{section.title}</p>
        {section.id === "protein" && (
          <span className={`ml-auto text-[10px] font-heading px-2 py-0.5 rounded-full border-2 ${a.badge}`}>
            {PROTEIN_GOAL}
          </span>
        )}
      </div>
      {section.subtitle && <p className="text-xs text-gray-400 mb-3">{section.subtitle}</p>}
      <ul className="flex flex-col gap-1">
        {section.foods.map((food) => {
          const isDone = done.has(food.name);
          return (
            <li key={food.name} className="flex items-start gap-2.5">
              <button
                onClick={() => toggle(food.name)}
                aria-label={isDone ? `Quitar ${food.name}` : `Marcar ${food.name}`}
                className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center text-[11px] font-bold transition ${
                  isDone ? a.checked : "bg-white border-wood-200 text-transparent"
                }`}
              >
                ✓
              </button>
              <div className="min-w-0">
                <p className={`text-sm leading-snug ${isDone ? "text-gray-400 line-through" : "text-gray-700"}`}>
                  {food.name}
                </p>
                {food.note && <p className="text-[11px] text-gray-400">{food.note}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AvoidSection({ section }: { section: NutritionSection }) {
  return (
    <div className="rounded-2xl border-2 border-red-100 bg-red-50/60 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Ban size={15} className="text-red-400" />
        <p className="font-heading text-sm text-red-500">{section.title}</p>
      </div>
      <ul className="flex flex-col gap-1 mt-2">
        {section.foods.map((food) => (
          <li key={food.name} className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-red-300" />
            <div className="min-w-0">
              <p className="text-sm text-gray-600 leading-snug">{food.name}</p>
              {food.note && <p className="text-[11px] text-gray-400">{food.note}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function NutritionPage() {
  const name = useProfileStore((s) => s.name);
  const isKnifey = name === "Knifey";

  const includeSections = useMemo(
    () => NUTRITION_SECTIONS.filter((s) => s.kind === "include"),
    []
  );
  const avoidSections = useMemo(
    () => NUTRITION_SECTIONS.filter((s) => s.kind === "avoid"),
    []
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl game-title">Tu guía de nutrición</h1>

      <div className={`cozy-card p-5 ${isKnifey ? "knifey-card" : "forky-card"}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-meadow-300 to-meadow-600 flex items-center justify-center text-white shrink-0">
            <Salad size={20} />
          </div>
          <div>
            <p className="font-heading text-gray-800">{RULE_80_20.title}</p>
            <p className="text-xs text-gray-500">
              {isKnifey
                ? "Plan sostenible para no dejarlo a las 2 semanas"
                : "Tu plan para reducir cintura sin dejarlo a las 2 semanas"}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{RULE_80_20.body}</p>
        <div className="mt-3 h-2.5 rounded-full bg-wood-100 overflow-hidden">
          <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-meadow-400 to-meadow-600" />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 font-heading mt-1">
          <span>80-90% de la lista</span>
          <span>10-20% flexible</span>
        </div>
      </div>

      <div className="cozy-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Apple size={16} className="text-pinky-500" />
          <p className="font-heading text-sm text-gray-700">{TOP_3_CINTURA.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TOP_3_CINTURA.items.map((item) => (
            <span key={item} className="chip border-2 bg-pinky-50 border-pinky-200 text-pinky-600">
              {item}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-2">{TOP_3_CINTURA.note}</p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-wood-200 p-4 bg-white/60">
        <div className="flex items-center gap-2 mb-1">
          <Droplets size={15} className="text-sky-500" />
          <p className="text-xs font-heading text-gray-500">Marca lo que ya comes hoy</p>
        </div>
        <p className="text-[11px] text-gray-400 mb-2">
          Se guarda solo en este dispositivo y se reinicia cada día
        </p>
      </div>

      {includeSections.map((section) => (
        <IncludeSection key={section.id} section={section} />
      ))}

      <h2 className="font-heading text-lg game-title mt-2">A evitar o minimizar</h2>
      {avoidSections.map((section) => (
        <AvoidSection key={section.id} section={section} />
      ))}

      <p className="text-center text-[11px] text-gray-400 pb-2">
        El objetivo no es prohibir: es que el 80-90% de lo que comes sume
      </p>
    </div>
  );
}
