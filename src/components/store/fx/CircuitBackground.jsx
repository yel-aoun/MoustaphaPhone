// Decorative circuit-board traces with light pulses travelling along them.
const TRACES = [
  'M0 70 H180 L220 110 H360 L390 80 H520',
  'M0 210 H120 L160 170 H300',
  'M800 60 H640 L600 100 H470 L440 130 H380',
  'M800 190 H690 L650 230 H540 L510 200 H430',
  'M0 330 H210 L250 290 H380 L410 320 H560',
  'M800 330 H700 L660 290 H600',
  'M260 0 V60 L300 100 V150',
  'M560 400 V330 L520 290 V240',
  'M120 400 V350 L160 310 H230',
  'M700 0 V40 L660 80 H610',
];

const NODES = [
  [520, 80], [300, 170], [380, 130], [430, 200], [560, 320], [600, 290],
  [300, 150], [520, 240], [230, 310], [610, 80], [180, 70], [690, 190],
];

const CHIPS = [
  [356, 118, 58, 40], [470, 214, 46, 46], [180, 300, 40, 28],
];

export default function CircuitBackground({ className = '', pulses = true }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 800 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" opacity="0.18">
        {TRACES.map((d) => <path key={d} d={d} />)}
        {CHIPS.map(([x, y, w, h]) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width={w} height={h} rx="4" />
            {Array.from({ length: Math.floor(w / 10) }).map((_, i) => (
              <g key={i}>
                <path d={`M${x + 6 + i * 10} ${y} v-6`} />
                <path d={`M${x + 6 + i * 10} ${y + h} v6`} />
              </g>
            ))}
          </g>
        ))}
      </g>
      <g fill="currentColor" opacity="0.28">
        {NODES.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" />)}
      </g>
      {pulses && (
        <g fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round">
          {TRACES.map((d, i) => (
            <path
              key={d}
              d={d}
              pathLength="100"
              strokeDasharray="8 100"
              className="animate-trace"
              style={{ animationDelay: `${(i * 0.7) % 4.5}s`, animationDuration: `${3.6 + (i % 4) * 0.8}s` }}
            />
          ))}
        </g>
      )}
    </svg>
  );
}
