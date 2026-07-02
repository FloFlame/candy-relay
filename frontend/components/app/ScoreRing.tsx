export function ScoreRing({
  value,
  color,
  size = 72,
  label,
}: {
  value: number;
  color: string;
  size?: number;
  label?: string;
}) {
  const stroke = size < 60 ? 6 : 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-100 dark:stroke-slate-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-bold leading-none text-slate-900 dark:text-white" style={{ fontSize: size / 3.2 }}>
          {value}
        </div>
        {label && <div className="text-[9px] font-medium uppercase tracking-wide text-slate-400">{label}</div>}
      </div>
    </div>
  );
}
