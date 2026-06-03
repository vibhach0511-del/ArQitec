// HeroLattice — the live, breathing 5×5 junction-lattice visualization for
// the landing page. Cycles through a few plausible doping configurations on a
// timer to suggest "the sampler is always running," with dopants pulsing in
// cyan and a step counter underneath.

import { useEffect, useState } from "react";

type Cell = "host" | "dopant" | "undoped";
type Pattern = Cell[][];

// Six hand-picked patterns. Each one is a plausible Gibbs-sample step —
// the cycle gives the page a sense of live exploration without random jitter.
const PATTERNS: Pattern[] = [
  // 0 — symmetric eight-dopant cross
  [
    ["undoped", "host",   "undoped", "host",   "undoped"],
    ["host",    "dopant", "host",    "dopant", "host"   ],
    ["undoped", "host",   "dopant",  "host",   "undoped"],
    ["host",    "dopant", "host",    "dopant", "host"   ],
    ["undoped", "host",   "undoped", "host",   "undoped"],
  ],
  // 1 — diagonal-heavy variant
  [
    ["dopant",  "host",   "undoped", "host",   "undoped"],
    ["host",    "host",   "dopant",  "host",   "host"   ],
    ["undoped", "dopant", "dopant",  "dopant", "undoped"],
    ["host",    "host",   "dopant",  "host",   "host"   ],
    ["undoped", "host",   "undoped", "host",   "dopant" ],
  ],
  // 2 — rotated cross, sparser
  [
    ["undoped", "dopant", "host",    "dopant", "undoped"],
    ["dopant",  "host",   "host",    "host",   "dopant" ],
    ["host",    "host",   "dopant",  "host",   "host"   ],
    ["dopant",  "host",   "host",    "host",   "dopant" ],
    ["undoped", "dopant", "host",    "dopant", "undoped"],
  ],
  // 3 — center-and-perimeter
  [
    ["host",    "undoped","dopant",  "undoped","host"   ],
    ["undoped", "dopant", "host",    "dopant", "undoped"],
    ["dopant",  "host",   "dopant",  "host",   "dopant" ],
    ["undoped", "dopant", "host",    "dopant", "undoped"],
    ["host",    "undoped","dopant",  "undoped","host"   ],
  ],
];

export function HeroLattice({ size = 560 }: { size?: number }) {
  const [patternIdx, setPatternIdx] = useState(0);
  const [iter, setIter] = useState(1247);

  // Cycle to the next pattern every 3 seconds, increment "iteration" counter
  // faster so it never sits still.
  useEffect(() => {
    const swap = setInterval(() => setPatternIdx((i) => (i + 1) % PATTERNS.length), 3000);
    const tick = setInterval(() => setIter((n) => n + Math.floor(Math.random() * 7) + 3), 320);
    return () => {
      clearInterval(swap);
      clearInterval(tick);
    };
  }, []);

  const N = 5;
  const cellSize = size / N;
  const pad = 4;
  const pattern = PATTERNS[patternIdx];

  return (
    <div className="inline-flex flex-col items-center select-none">
      <div className="relative">
        {/* Subtle glow halo behind the lattice */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.10), transparent 65%)",
          }}
        />

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="relative"
        >
          {/* corner crosshairs — gives it a "tech surface" feel */}
          {[
            [4, 4], [size - 4, 4], [4, size - 4], [size - 4, size - 4],
          ].map(([cx, cy], i) => (
            <g key={i} stroke="rgba(10,10,10,0.35)" strokeWidth="1">
              <line x1={cx - 8} y1={cy} x2={cx + 8} y2={cy} />
              <line x1={cx} y1={cy - 8} x2={cx} y2={cy + 8} />
            </g>
          ))}

          {pattern.flatMap((row, r) =>
            row.map((cell, c) => {
              const x = c * cellSize + pad;
              const y = r * cellSize + pad;
              const w = cellSize - pad * 2;
              const cx = x + w / 2;
              const cy = y + w / 2;
              const key = `${patternIdx}-${r}-${c}`;

              return (
                <g key={key}>
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={w}
                    fill={cell === "dopant" ? "rgba(6, 182, 212, 0.07)" : "#ffffff"}
                    stroke="rgba(10, 10, 10, 0.10)"
                    strokeWidth="1"
                  />
                  {cell === "host" && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={w * 0.24}
                      fill="#0a0a0a"
                      style={{ transition: "all 0.4s ease" }}
                    />
                  )}
                  {cell === "dopant" && (
                    <g>
                      <circle cx={cx} cy={cy} r={w * 0.42} fill="rgba(6, 182, 212, 0.18)">
                        <animate
                          attributeName="r"
                          values={`${w * 0.34};${w * 0.46};${w * 0.34}`}
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.4;0;0.4"
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <rect
                        x={cx - w * 0.2}
                        y={cy - w * 0.2}
                        width={w * 0.4}
                        height={w * 0.4}
                        fill="#06b6d4"
                        transform={`rotate(45 ${cx} ${cy})`}
                      />
                    </g>
                  )}
                  {cell === "undoped" && (
                    <circle cx={cx} cy={cy} r={w * 0.045} fill="rgba(10,10,10,0.25)" />
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>

      {/* Status strip */}
      <div className="mt-6 flex items-center gap-6 mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--cyan)",
              boxShadow: "0 0 8px var(--cyan)",
              animation: "hero-pulse 1.4s ease-in-out infinite",
            }}
          />
          sampling
        </span>
        <span>iteration <span className="tabular-nums text-foreground">{iter.toLocaleString()}</span></span>
        <span>p_L <span className="tabular-nums text-foreground">9.4e−07</span></span>
        <span>η <span className="tabular-nums text-foreground">12.3</span></span>
      </div>

      <style>{`
        @keyframes hero-pulse {
          0%, 100% { transform: scale(1);   opacity: 1; }
          50%      { transform: scale(1.4); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
