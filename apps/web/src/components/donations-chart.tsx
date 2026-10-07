import { TYPE_COLORS } from '@/lib/constants';

type Row = { month: string; course: number; service: number; other: number };
const KEYS = ['course', 'service', 'other'] as const;

/** Server-rendered stacked bar chart (SVG) of donations per month, by type. */
export function DonationsChart({
  data,
  locale,
  labels,
  currency,
}: {
  data: Row[];
  locale: string;
  labels: Record<(typeof KEYS)[number], string>;
  currency: string;
}) {
  const W = 720;
  const H = 240;
  const pad = { l: 44, r: 8, t: 8, b: 28 };
  const max = Math.max(1, ...data.map((d) => d.course + d.service + d.other));
  const nice = Math.ceil(max / 100 / 4 / 50) * 50 * 4 * 100 || max;
  const bw = (W - pad.l - pad.r) / data.length;
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / nice);
  const money = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
  const month = new Intl.DateTimeFormat(locale, { month: 'short' });
  const ticks = [0, 1, 2, 3, 4].map((i) => (nice / 4) * i);

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Donations per month" className="w-full">
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={y(t)}
              y2={y(t)}
              stroke="#e3dac6"
              strokeDasharray={t ? '3 4' : undefined}
            />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#6b7a70">
              {money.format(t / 100)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          let acc = 0;
          const x = pad.l + i * bw + bw * 0.18;
          const [yy, mm] = d.month.split('-').map(Number) as [number, number];
          return (
            <g key={d.month}>
              <title>{`${month.format(new Date(yy, mm - 1, 1))} ${yy} — ${money.format((d.course + d.service + d.other) / 100)}`}</title>
              {KEYS.map((k) => {
                const v = d[k];
                if (!v) return null;
                const top = y(acc + v);
                const h = y(acc) - top;
                acc += v;
                return (
                  <rect
                    key={k}
                    x={x}
                    y={top}
                    width={bw * 0.64}
                    height={h}
                    fill={TYPE_COLORS[k]}
                    rx={2}
                  />
                );
              })}
              <text x={x + bw * 0.32} y={H - 10} textAnchor="middle" fontSize="10" fill="#6b7a70">
                {month.format(new Date(yy, mm - 1, 1))}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex gap-5 text-xs text-muted">
        {KEYS.map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: TYPE_COLORS[k] }} />
            {labels[k]}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
