import { useState } from "react";
import { money } from "./ui";

// Validated pair (light surface, CVD-safe): revenue = brand dark blue, costs = deep orange
export const SERIES = { revenue: "#1B7DB3", costs: "#C2410C" };

// Round the axis top up to 1 / 2 / 2.5 / 5 / 10 × a power of ten
const niceMax = (v) => {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v);
};
const short = (n) => (Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : Math.abs(n) >= 1e3 ? `${+(n / 1e3).toFixed(1)}k` : `$${Math.round(n)}`);

export function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-gray-600">
      {items.map(([label, color]) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} aria-hidden="true" />
          {label}
        </span>
      ))}
    </div>
  );
}

/**
 * Grouped bars: revenue vs costs per period, one shared USD axis.
 * Hover / focus a period to see revenue, costs and profit.
 */
export function RevenueCostChart({ rows, label = (r) => r.period }) {
  const [active, setActive] = useState(null);
  const W = 720, H = 240, L = 48, B = 26, T = 10;
  const max = niceMax(Math.max(...rows.map((r) => Math.max(r.revenue, r.costs)), 0));
  const plotW = W - L - 8, plotH = H - B - T;
  const slot = plotW / Math.max(rows.length, 1);
  const barW = Math.max(3, Math.min(22, (slot - 8) / 2));
  const y = (v) => T + plotH - (v / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const every = Math.ceil(rows.length / 12); // thin out x labels
  const a = active != null ? rows[active] : null;

  const bar = (x, v, color) => {
    const h = Math.max(0, (v / max) * plotH);
    if (h <= 0) return null;
    const r = Math.min(4, barW / 2, h);
    // rounded top, square base on the axis
    return <path d={`M${x},${T + plotH} v${-(h - r)} q0,${-r} ${r},${-r} h${barW - 2 * r} q${r},0 ${r},${r} v${h - r} z`} fill={color} />;
  };

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Revenue and costs by period">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - 8} y1={y(t)} y2={y(t)} stroke="#E5E7EB" strokeWidth="1" />
            <text x={L - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill="#6B7280">{short(t)}</text>
          </g>
        ))}
        {rows.map((r, i) => {
          const x0 = L + i * slot + (slot - (barW * 2 + 2)) / 2;
          return (
            <g key={r.period} tabIndex={0} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)} className="outline-none">
              <rect x={L + i * slot} y={T} width={slot} height={plotH} fill={active === i ? "#F0FAFF" : "transparent"} />
              {bar(x0, r.revenue, SERIES.revenue)}
              {bar(x0 + barW + 2, r.costs, SERIES.costs)}
              {i % every === 0 && <text x={L + i * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="#6B7280">{label(r)}</text>}
            </g>
          );
        })}
        <line x1={L} x2={W - 8} y1={T + plotH} y2={T + plotH} stroke="#D1D5DB" />
      </svg>
      {a && (
        <div className="pointer-events-none absolute top-2 right-2 bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs min-w-[160px]" role="status">
          <p className="font-semibold text-gray-900 mb-1">{label(a)}</p>
          <p className="flex justify-between gap-4"><span className="text-gray-600">Revenue</span><span className="font-semibold tabular-nums">{money(a.revenue)}</span></p>
          <p className="flex justify-between gap-4"><span className="text-gray-600">Costs</span><span className="font-semibold tabular-nums">{money(a.costs)}</span></p>
          <p className="flex justify-between gap-4 border-t border-gray-100 mt-1 pt-1"><span className="text-gray-600">Profit</span><span className={`font-bold tabular-nums ${a.profit < 0 ? "text-red-600" : "text-green-700"}`}>{money(a.profit)}</span></p>
        </div>
      )}
    </div>
  );
}

/** Horizontal bars, single series, value label at the end. rows: [{ label, value, display? }] */
export function HBarList({ rows, color = SERIES.revenue, format = money }) {
  const max = Math.max(...rows.map((r) => r.value), 0) || 1;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(90px,30%)_1fr_auto] items-center gap-3 text-sm" title={`${r.label}: ${r.display ?? format(r.value)}`}>
          <span className="text-gray-700 truncate">{r.label}</span>
          <span className="h-2.5 rounded-r bg-gray-100 overflow-hidden">
            <span className="block h-full rounded-r" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </span>
          <span className="font-semibold text-gray-900 tabular-nums text-right">{r.display ?? format(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}
