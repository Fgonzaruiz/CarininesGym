import { useState } from "react";
import type { MuscleKey } from "../lib/muscleMap";
import { MUSCLE_KEYS, MUSCLE_LABELS, muscleColor } from "../lib/muscleMap";
import { muscleKeyForTarget } from "../lib/muscleMap";
import type { Exercise } from "../types/exercise";
import { filterSafeExercises } from "../lib/injuries";
import type { InjuryId } from "../lib/injuries";
import bodyPaths from "../lib/bodyPaths";
import type { BodyView } from "../lib/bodyPaths";

/** Partes del cuerpo que forman la silueta y nunca se colorean con el dato. */
const INERT = ["head", "hair", "neck", "hands", "feet", "knees", "ankles"];
/** Colores base del cuerpo */
const SKIN = "#f6e3cf";
const OUTLINE = "#d9a97a";
const HAIR = "#8d6e63";
const HAIRLINE = "rgba(90,60,30,0.30)";

export interface MuscleDetailItem {
  id: string;
  name: string;
  sessions: number;
}

interface MuscleMapProps {
  counts: Record<string, number>;
  /** Unidad de la leyenda de color (por defecto "Sesiones") */
  periodLabel?: string;
  /** Texto del resumen "N grupos trabajados {summaryLabel}" */
  summaryLabel?: string;
  /** Texto de las chips de no entrenados */
  untrainedLabel?: string;
  /** Lista override de músculos sin entrenar (para pantallas tipo "hoy") */
  untrained?: MuscleKey[];
  /** Ejercicios hechos por músculo en el periodo (para el panel al pulsar) */
  muscleDetail?: Partial<Record<MuscleKey, MuscleDetailItem[]>>;
  /** Catálogo completo: para sugerir cómo entrenar un músculo sin registrar */
  catalog?: Exercise[];
  /** Lesiones activas (filtran las sugerencias del catálogo) */
  injuries?: InjuryId[];
  /** Al pulsar un ejercicio del panel */
  onViewExercise?: (exerciseId: string) => void;
}

/** Grupo muscular clicable sobre la geometría de OpenGym. */
function MuscleGroup({
  label,
  selected,
  interactive,
  onSelect,
  d,
  level,
}: {
  label: string;
  selected: boolean;
  interactive: boolean;
  onSelect: () => void;
  d: string;
  level: number;
}) {
  const fill = muscleColor(level);
  return (
    <g
      onClick={interactive ? onSelect : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={label}
      className={interactive ? "cursor-pointer outline-none" : undefined}
    >
      <title>{label}</title>
      <path
        d={d}
        fill={fill}
        stroke={selected ? "#2e7d32" : HAIRLINE}
        strokeWidth={selected ? 1.8 : 1}
        strokeLinejoin="round"
      />
      {/* Zona de clic generosa e invisible (trazo transparente ancho) */}
      {interactive && (
        <path d={d} fill="transparent" stroke="transparent" strokeWidth={7} pointerEvents="all" />
      )}
    </g>
  );
}

/** Una vista (frente o espalda) dibujada con la geometría de OpenGym. */
function BodyFigure({
  view,
  levels,
  selected,
  onSelect,
  ariaLabel,
}: {
  view: BodyView;
  levels: Record<string, number>;
  selected: MuscleKey | null;
  onSelect: (key: MuscleKey) => void;
  ariaLabel: string;
}) {
  return (
    <svg viewBox={view.vb} className="w-full max-w-[190px]" role="img" aria-label={ariaLabel}>
      {INERT.map((slug) =>
        (view.p[slug] ?? []).map((d, i) => (
          <path
            key={slug + i}
            d={d}
            fill={slug === "hair" ? HAIR : SKIN}
            stroke={OUTLINE}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))
      )}
      {MUSCLE_KEYS.map((slug) =>
        (view.p[slug] ?? []).map((d, i) => (
          <MuscleGroup
            key={slug + i}
            label={MUSCLE_LABELS[slug]}
            selected={selected === slug}
            interactive={Boolean(onSelect)}
            onSelect={() => onSelect(slug)}
            d={d}
            level={levels[slug] ?? 0}
          />
        ))
      )}
    </svg>
  );
}

function Legend({ unit }: { unit: string }) {
  const steps: Array<[string, string]> = [
    [muscleColor(0), "0"],
    [muscleColor(1), "1"],
    [muscleColor(2), "2"],
    [muscleColor(3), "3"],
    [muscleColor(4), "4+"],
  ];
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="text-[10px] text-gray-400 font-heading">{unit}:</span>
      {steps.map(([color, label]) => (
        <span key={label} className="flex items-center gap-1">
          <span
            className="w-3.5 h-3.5 rounded-full border"
            style={{ backgroundColor: color, borderColor: "rgba(150,100,50,0.4)" }}
          />
          <span className="text-[10px] text-gray-500">{label}</span>
        </span>
      ))}
    </div>
  );
}

export default function MuscleMap({
  counts,
  periodLabel = "Sesiones",
  summaryLabel = "esta semana",
  untrainedLabel = "sin entrenar",
  untrained: untrainedOverride,
  muscleDetail,
  catalog,
  injuries,
  onViewExercise,
}: MuscleMapProps) {
  const [selected, setSelected] = useState<MuscleKey | null>(null);
  const [body, setBody] = useState<"male" | "female">("male");

  const trained = MUSCLE_KEYS.filter((k) => (counts[k] ?? 0) > 0);
  const untrained = untrainedOverride ?? MUSCLE_KEYS.filter((k) => !((counts[k] ?? 0) > 0));
  const anyTrained = trained.length > 0;

  const safeCatalog =
    catalog && injuries && injuries.length > 0 ? filterSafeExercises(catalog, injuries) : catalog;

  function handleSelect(key: MuscleKey) {
    setSelected((prev) => (prev === key ? null : key));
  }

  const detail = selected ? (muscleDetail?.[selected] ?? []) : [];
  const suggestions = selected
    ? (safeCatalog ?? [])
        .filter((e) => {
          const t = muscleKeyForTarget(e.target);
          return t === selected || e.secondary_muscles.some((m) => muscleKeyForTarget(m) === selected);
        })
        .slice(0, 4)
    : [];

  const geometry = bodyPaths[body];

  return (
    <div className="flex flex-col gap-3">
      {/* Selector de figura: hombre / mujer */}
      <div className="flex justify-center">
        <div className="flex rounded-full border border-wood-200 bg-wood-50 p-0.5">
          {(["male", "female"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBody(b)}
              className={`rounded-full px-3 py-1 text-[11px] font-heading transition active:scale-95 ${
                body === b ? "bg-white text-meadow-700 shadow-sm" : "text-wood-500"
              }`}
            >
              {b === "male" ? "👨 Hombre" : "👩 Mujer"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start justify-center gap-2">
        <div className="flex flex-col items-center gap-1 w-1/2">
          <BodyFigure
            view={geometry.front}
            levels={counts}
            selected={selected}
            onSelect={handleSelect}
            ariaLabel="Mapa muscular frontal"
          />
          <span className="text-[10px] font-heading text-gray-400">Frente</span>
        </div>
        <div className="flex flex-col items-center gap-1 w-1/2">
          <BodyFigure
            view={geometry.back}
            levels={counts}
            selected={selected}
            onSelect={handleSelect}
            ariaLabel="Mapa muscular dorsal"
          />
          <span className="text-[10px] font-heading text-gray-400">Espalda</span>
        </div>
      </div>

      <Legend unit={periodLabel} />

      {!anyTrained && !untrainedOverride ? (
        <p className="text-center text-xs text-gray-400">
          Entrena en este periodo y tus músculos se irán coloreando 💪
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-heading text-meadow-700">
            {trained.length} grupos trabajados {summaryLabel}
          </p>
          {untrained.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {untrained.map((k) => (
                <button
                  key={k}
                  onClick={() => handleSelect(k)}
                  className={`chip border transition active:scale-95 ${
                    selected === k
                      ? "bg-meadow-100 text-meadow-800 border-meadow-300"
                      : "bg-wood-50 text-wood-500 border-wood-200 hover:bg-wood-100"
                  }`}
                >
                  {MUSCLE_LABELS[k]}
                </button>
              ))}
              <span className="text-[10px] text-gray-400 self-center">{untrainedLabel}</span>
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="rounded-2xl border border-meadow-200 bg-meadow-50/60 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-heading text-xs text-meadow-800">
              {MUSCLE_LABELS[selected]}
              <span className="text-meadow-600 ml-1">
                · {(counts[selected] ?? 0) === 1 ? "1 sesión" : `${counts[selected] ?? 0} sesiones`}
              </span>
            </p>
            <button
              onClick={() => setSelected(null)}
              className="text-[10px] text-meadow-600 font-heading border border-meadow-300 rounded-full px-2 py-0.5"
            >
              cerrar
            </button>
          </div>

          {detail.length > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-meadow-700">Lo has trabajado con:</p>
              {detail.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewExercise?.(item.id)}
                  disabled={!onViewExercise}
                  className="flex items-center justify-between gap-2 bg-white rounded-xl px-2.5 py-1.5 text-left active:scale-[0.98] transition disabled:active:scale-100"
                >
                  <span className="text-xs text-gray-700 capitalize truncate">{item.name}</span>
                  <span className="text-[10px] text-meadow-600 shrink-0 font-heading">
                    {item.sessions} {item.sessions === 1 ? "sesión" : "sesiones"}
                  </span>
                </button>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-meadow-700">
                {anyTrained ? "Sin registrar aquí este periodo." : "Sin registrar."} Ideas para
                entrenarlo:
              </p>
              {suggestions.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => onViewExercise?.(ex.id)}
                  disabled={!onViewExercise}
                  className="flex items-center justify-between gap-2 bg-white rounded-xl px-2.5 py-1.5 text-left active:scale-[0.98] transition disabled:active:scale-100"
                >
                  <span className="text-xs text-gray-700 capitalize truncate">{ex.name}</span>
                  <span className="text-[10px] text-gray-400 capitalize shrink-0">{ex.equipment}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-meadow-700">
              {anyTrained ? "Sin registrar aquí este periodo." : "Sin registrar."} Busca ejercicios en
              la biblioteca para trabajarlo.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
