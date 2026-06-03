// LatticeHeatmap — 5×5 junction-lattice doping pattern. Phase A is a static
// pattern that shows the visual story; Phase B will accept live data from the
// THRML Gibbs sampler.

type Cell = "host" | "dopant" | "undoped";

// A reasonably-pretty deterministic pattern for the static demo. 4-fold
// symmetric, 8 dopants placed near the centre — looks like real Gibbs output.
const DEFAULT_PATTERN: Cell[][] = [
  ["undoped", "host", "undoped", "host", "undoped"],
  ["host",    "dopant","host",    "dopant","host"   ],
  ["undoped", "host",  "dopant",  "host",  "undoped"],
  ["host",    "dopant","host",    "dopant","host"   ],
  ["undoped", "host",  "undoped", "host",  "undoped"],
];

export function LatticeHeatmap({
  pattern = DEFAULT_PATTERN,
  size = 320,
}: {
  pattern?: Cell[][];
  size?: number;
}) {
  const N = pattern.length;
  const cellSize = size / N;
  const pad = 2;

  return (
    <div className="inline-flex flex-col items-start">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {pattern.flatMap((row, r) =>
          row.map((cell, c) => {
            const x = c * cellSize + pad;
            const y = r * cellSize + pad;
            const w = cellSize - pad * 2;
            const cx = x + w / 2;
            const cy = y + w / 2;

            return (
              <g key={`${r}-${c}`}>
                {/* cell background */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={w}
                  fill={cell === "dopant" ? "rgba(6, 182, 212, 0.06)" : "#ffffff"}
                  stroke="rgba(10, 10, 10, 0.08)"
                  strokeWidth="1"
                />
                {/* glyph */}
                {cell === "host" && (
                  <circle cx={cx} cy={cy} r={w * 0.22} fill="#0a0a0a" />
                )}
                {cell === "dopant" && (
                  <g>
                    {/* pulse halo */}
                    <circle cx={cx} cy={cy} r={w * 0.34} fill="rgba(6, 182, 212, 0.18)">
                      <animate attributeName="r"
                        values={`${w*0.30};${w*0.42};${w*0.30}`}
                        dur="2.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity"
                        values="0.35;0;0.35"
                        dur="2.4s" repeatCount="indefinite" />
                    </circle>
                    {/* dopant diamond */}
                    <rect
                      x={cx - w * 0.18}
                      y={cy - w * 0.18}
                      width={w * 0.36}
                      height={w * 0.36}
                      fill="#06b6d4"
                      transform={`rotate(45 ${cx} ${cy})`}
                    />
                  </g>
                )}
                {cell === "undoped" && (
                  <circle cx={cx} cy={cy} r={w * 0.04} fill="rgba(10, 10, 10, 0.25)" />
                )}
              </g>
            );
          })
        )}
      </svg>
      <div className="flex items-center gap-4 mt-3 mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#0a0a0a" }} />
          host
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rotate-45" style={{ background: "var(--cyan)" }} />
          dopant
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-0.5 rounded-full" style={{ background: "rgba(10,10,10,0.4)" }} />
          undoped
        </span>
      </div>
    </div>
  );
}
