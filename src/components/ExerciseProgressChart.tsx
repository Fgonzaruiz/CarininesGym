import type { ExerciseHistoryPoint } from "../lib/sessionsApi";

interface ChartSeriesProps {
  idPrefix: string;
  title: string;
  unit: string;
  color: string;
  fill: string;
  history: ExerciseHistoryPoint[];
  valueKey: "weight" | "reps" | "volume";
}

function LineChart({ idPrefix, title, unit, color, fill, history, valueKey }: ChartSeriesProps) {
  const values = history.map((h) => h[valueKey]);
  const hasData = values.some((v) => v > 0);
  if (!hasData) return null;

  const width = 280;
  const height = 100;
  const padX = 8;
  const padY = 12;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const min = Math.min(...values);
  const max = Math.max(...values, min + 1);
  const range = max - min || 1;

  const points = history.map((h, i) => {
    const x = padX + (history.length === 1 ? chartW / 2 : (i / (history.length - 1)) * chartW);
    const val = h[valueKey];
    const y = padY + chartH - ((val - min) / range) * chartH;
    return { x, y, val, date: h.date };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padY + chartH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padY + chartH).toFixed(1)} Z`;

  const labelIndexes =
    history.length <= 6
      ? history.map((_, i) => i)
      : [0, Math.floor(history.length / 2), history.length - 1];

  const gradId = `${idPrefix}-${valueKey}`;

  return (
    <div className="mt-3">
      <p className="text-[10px] font-heading uppercase tracking-wide text-gray-400 mb-1.5">
        {title}
      </p>
      <svg
        viewBox={`0 0 ${width} ${height + 18}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Grafica de ${title}`}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity="0.35" />
            <stop offset="100%" stopColor={fill} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={padX}
            y1={padY + chartH * (1 - t)}
            x2={width - padX}
            y2={padY + chartH * (1 - t)}
            stroke="#e7e5e4"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ))}
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke={color} strokeWidth="2" />
            <title>{`${p.date}: ${p.val} ${unit}`}</title>
          </g>
        ))}
        {labelIndexes.map((i) => {
          const p = points[i];
          return (
            <text
              key={i}
              x={p.x}
              y={height + 14}
              textAnchor="middle"
              className="fill-gray-400 text-[9px]"
            >
              {p.date.slice(5).replace("-", "/")}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function ExerciseProgressChart({
  history,
  chartId = "ex",
}: {
  history: ExerciseHistoryPoint[];
  chartId?: string;
}) {
  if (history.length === 0) return null;

  const hasWeight = history.some((h) => h.weight > 0);

  return (
    <div className="rounded-xl bg-wood-50/60 border border-wood-100 p-3">
      {hasWeight && (
        <LineChart
          idPrefix={chartId}
          title="Peso (kg)"
          unit="kg"
          color="#9333ea"
          fill="#9333ea"
          history={history}
          valueKey="weight"
        />
      )}
      <LineChart
        idPrefix={chartId}
        title={hasWeight ? "Repeticiones" : "Repeticiones por sesion"}
        unit="reps"
        color="#558b2f"
        fill="#558b2f"
        history={history}
        valueKey="reps"
      />
      {hasWeight && (
        <LineChart
          idPrefix={chartId}
          title="Volumen (kg x reps)"
          unit="kg"
          color="#d97706"
          fill="#d97706"
          history={history}
          valueKey="volume"
        />
      )}
    </div>
  );
}
