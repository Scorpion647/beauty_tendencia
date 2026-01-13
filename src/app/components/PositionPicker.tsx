import React from "react";

type PositionPickerProps = {
  value?: string | null;
  onChange: (pos: string) => void;
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function parsePosition(pos?: string): { x: number; y: number } {
  const p = (pos ?? "50% 50%").trim().toLowerCase();

  // atajos
  if (p === "top") return { x: 50, y: 0 };
  if (p === "bottom") return { x: 50, y: 100 };
  if (p === "left") return { x: 0, y: 50 };
  if (p === "right") return { x: 100, y: 50 };
  if (p === "center") return { x: 50, y: 50 };

  // "50% 25%" / "50 25" / "50% 25"
  const parts = p.split(/\s+/);
  const toNum = (v: string) => Number(v.replace("%", ""));
  const x = clamp(Number.isFinite(toNum(parts[0] ?? "")) ? toNum(parts[0]) : 50);
  const y = clamp(Number.isFinite(toNum(parts[1] ?? "")) ? toNum(parts[1]) : 50);
  return { x, y };
}

function formatPosition(x: number, y: number) {
  return `${clamp(x)}% ${clamp(y)}%`;
}


export function PositionPicker({ value, onChange }: PositionPickerProps) {
  const initial = parsePosition(value ?? undefined);
  const [x, setX] = React.useState(initial.x);
  const [y, setY] = React.useState(initial.y);

  // si cambia desde afuera (ej: load), sincroniza
  React.useEffect(() => {
    const p = parsePosition(value ?? undefined);
    setX(p.x);
    setY(p.y);
  }, [value]);

  const emit = (nx: number, ny: number) => {
    onChange(formatPosition(nx, ny));
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Presets rápidos */}
      <div className="flex flex-wrap gap-1">
        {[
          { label: "Arriba", x: 50, y: 0 },
          { label: "Centro", x: 50, y: 50 },
          { label: "Abajo", x: 50, y: 100 },
          { label: "Izquierda", x: 0, y: 50 },
          { label: "Derecha", x: 100, y: 50 },
        ].map((p) => (
          <button
            key={p.label}
            type="button"
            className="px-2 py-0.5 rounded bg-gray-200 text-black text-[10px] sm:text-xs"
            onClick={() => {
              setX(p.x);
              setY(p.y);
              emit(p.x, p.y);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-700 w-10">X</span>
          <input
            type="range"
            min={0}
            max={100}
            value={x}
            onChange={(e) => {
              const nx = Number(e.target.value);
              setX(nx);
              emit(nx, y);
            }}
            className="flex-1"
          />
          <span className="text-[10px] text-gray-700 w-10 text-right">{x}%</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-700 w-10">Y</span>
          <input
            type="range"
            min={0}
            max={100}
            value={y}
            onChange={(e) => {
              const ny = Number(e.target.value);
              setY(ny);
              emit(x, ny);
            }}
            className="flex-1"
          />
          <span className="text-[10px] text-gray-700 w-10 text-right">{y}%</span>
        </div>

        <div className="text-[10px] text-gray-600">
          object-position: <span className="font-mono">{formatPosition(x, y)}</span>
        </div>
      </div>
    </div>
  );
}
