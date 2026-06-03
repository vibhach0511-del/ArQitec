import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ERROR_BUDGETS = [
  { rate: '10⁻³', label: 'High Noise', color: '#7c3aed', glow: 'rgba(124, 58, 237, 0.4)', qubits: 9, threshold: 0.82 },
  { rate: '10⁻⁴', label: 'Moderate', color: '#22d3ee', glow: 'rgba(34, 211, 238, 0.4)', qubits: 25, threshold: 0.94 },
  { rate: '10⁻⁵', label: 'Low Noise', color: '#a78bfa', glow: 'rgba(167, 139, 250, 0.4)', qubits: 49, threshold: 0.985 },
  { rate: '10⁻⁶', label: 'Ultra-Low', color: '#67e8f9', glow: 'rgba(103, 232, 249, 0.4)', qubits: 81, threshold: 0.998 },
];

function QubitGrid({ n, color, glow, fidelity }) {
  const side = Math.round(Math.sqrt(n));
  const cells = Array.from({ length: side * side });

  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${side}, 1fr)` }}
    >
      {cells.map((_, i) => {
        const row = Math.floor(i / side);
        const col = i % side;
        // create radial "good zone" — center qubits are always good, edges vary
        const dx = (col - (side - 1) / 2) / ((side - 1) / 2);
        const dy = (row - (side - 1) / 2) / ((side - 1) / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const baseOk = dist < fidelity * 1.2;
        const ok = baseOk;

        return (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.008, duration: 0.3, ease: 'backOut' }}
            className="relative rounded-sm aspect-square"
            style={{
              background: ok
                ? `radial-gradient(circle at 40% 35%, ${color}cc, ${color}55)`
                : 'rgba(255,255,255,0.04)',
              boxShadow: ok ? `0 0 6px ${glow}` : 'none',
              border: ok ? `1px solid ${color}44` : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {ok && (
              <motion.div
                className="absolute inset-0 rounded-sm opacity-0"
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ duration: 2 + (i % 4) * 0.5, repeat: Infinity, delay: i * 0.03 }}
                style={{ background: `radial-gradient(circle, ${color}88, transparent)` }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default function ChipVisualizer() {
  const [activeIdx, setActiveIdx] = useState(2);
  const budget = ERROR_BUDGETS[activeIdx];

  // auto-cycle
  useEffect(() => {
    const t = setInterval(() => setActiveIdx(i => (i + 1) % ERROR_BUDGETS.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-6 select-none">
      {/* Ambient glow behind chip */}
      <div
        className="absolute inset-0 rounded-3xl blur-[80px] opacity-20 transition-all duration-1000 pointer-events-none"
        style={{ background: budget.glow }}
      />

      {/* Chip frame */}
      <div className="relative z-10 glass rounded-2xl p-6 w-full max-w-xs">
        {/* Chip header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">Surface Code Array</p>
            <p className="font-mono text-sm font-bold mt-0.5" style={{ color: budget.color }}>
              {budget.qubits} physical qubits
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">Target ε_L</p>
            <p className="font-mono text-sm font-bold mt-0.5" style={{ color: budget.color }}>
              {budget.rate}
            </p>
          </div>
        </div>

        {/* Qubit grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4"
          >
            <QubitGrid n={budget.qubits} color={budget.color} glow={budget.glow} fidelity={budget.threshold} />
          </motion.div>
        </AnimatePresence>

        {/* Fidelity bar */}
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">Gate Fidelity</span>
            <span className="font-mono text-xs font-bold" style={{ color: budget.color }}>
              {(budget.threshold * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${budget.threshold * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              style={{ background: `linear-gradient(90deg, ${budget.color}88, ${budget.color})`, boxShadow: `0 0 8px ${budget.glow}` }}
            />
          </div>
        </div>

        {/* Material readout */}
        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
          {[
            { label: 'T₁', value: activeIdx === 0 ? '42μs' : activeIdx === 1 ? '118μs' : activeIdx === 2 ? '340μs' : '890μs' },
            { label: 'T₂', value: activeIdx === 0 ? '38μs' : activeIdx === 1 ? '95μs' : activeIdx === 2 ? '280μs' : '710μs' },
            { label: 'η', value: activeIdx === 0 ? '−180MHz' : activeIdx === 1 ? '−215MHz' : activeIdx === 2 ? '−240MHz' : '−260MHz' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-widest">{label}</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={value}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="font-mono text-xs font-bold mt-0.5"
                  style={{ color: budget.color }}
                >
                  {value}
                </motion.p>
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Budget selector tabs */}
      <div className="relative z-10 flex gap-2 flex-wrap justify-center">
        {ERROR_BUDGETS.map((b, i) => (
          <button
            key={b.rate}
            onClick={() => setActiveIdx(i)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-300"
            style={{
              border: `1px solid ${i === activeIdx ? b.color + '60' : 'rgba(255,255,255,0.08)'}`,
              background: i === activeIdx ? b.color + '15' : 'transparent',
              color: i === activeIdx ? b.color : 'rgba(255,255,255,0.3)',
              boxShadow: i === activeIdx ? `0 0 12px ${b.glow}` : 'none',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: i === activeIdx ? b.color : 'rgba(255,255,255,0.2)' }}
            />
            ε = {b.rate}
          </button>
        ))}
      </div>

      {/* Scanning line */}
      <motion.div
        className="absolute left-0 right-0 h-px opacity-20 pointer-events-none z-20"
        style={{ background: `linear-gradient(90deg, transparent, ${budget.color}, transparent)` }}
        animate={{ top: ['20%', '80%', '20%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}