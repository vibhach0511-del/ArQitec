import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';

// Seven-layer superconducting qubit stack. Top-of-chip → wafer.
// Material + thickness from the standard Al-junction / Nb-interconnect process.
// `property` captures the EM job each layer does + the material property
// that dominates the noise model for that role.
const LAYERS = [
  {
    n: '07',
    id: 'top-wiring',
    label: 'Top wiring / shielding',
    material: 'Superconductor',
    thickness: '30–100 nm',
    property: 'Crossover routing; magnetic / EMI shielding for the active region.',
    family: 'sc-metal',
  },
  {
    n: '06',
    id: 'interconnect',
    label: 'Interconnect / wiring',
    material: 'Al or Nb',
    thickness: '30–100 nm',
    property: 'Carries microwave signals between qubits — high Tc, low loss.',
    family: 'sc-metal',
  },
  {
    n: '05',
    id: 'jj-top',
    label: 'JJ top electrode',
    material: 'Aluminum (Al)',
    thickness: '20–30 nm',
    property: 'Other side of the Josephson junction; same purity demands as the base.',
    family: 'junction',
  },
  {
    n: '04',
    id: 'tunnel-barrier',
    label: 'Tunnel barrier',
    material: 'Aluminum oxide (AlOₓ)',
    thickness: '1–2 nm',
    property: 'The Josephson junction itself. Sub-nm thickness uniformity sets the qubit frequency.',
    family: 'junction-core',
  },
  {
    n: '03',
    id: 'jj-base',
    label: 'JJ base electrode',
    material: 'Aluminum (Al)',
    thickness: '20–30 nm',
    property: 'Cooper pairs in. Clean superconductor with a well-behaved native oxide.',
    family: 'junction',
  },
  {
    n: '02',
    id: 'ground-plane',
    label: 'Ground plane / resonator',
    material: 'Al or Nb',
    thickness: '30–100 nm',
    property: 'Carries supercurrent. High Tc, low surface loss, low kinetic-inductance variation.',
    family: 'sc-metal',
  },
  {
    n: '01',
    id: 'substrate',
    label: 'Substrate',
    material: 'Silicon or Sapphire (Al₂O₃)',
    thickness: '500–725 µm',
    property: 'Hosts the qubit E-field through its bulk. Low microwave loss tangent, low TLS density.',
    family: 'substrate',
  },
];

const FAMILY_COLOR = {
  'sc-metal':       { stroke: 'rgba(214, 220, 228, 0.85)', fill: 'rgba(214, 220, 228, 0.08)', glow: 'rgba(214, 220, 228, 0.30)', tint: 'rgba(214, 220, 228, 0.92)' },
  'junction':       { stroke: 'hsl(191, 97%, 55%)',         fill: 'hsla(191, 97%, 55%, 0.12)',   glow: 'hsla(191, 97%, 55%, 0.45)',  tint: 'hsl(191, 97%, 55%)'      },
  'junction-core':  { stroke: 'url(#irid-stroke)',           fill: 'url(#irid-fill)',            glow: 'rgba(255, 110, 199, 0.55)',  tint: '#ff8ad3'                  },
  'substrate':      { stroke: 'rgba(150, 165, 195, 0.6)',   fill: 'rgba(150, 165, 195, 0.05)', glow: 'rgba(150, 165, 195, 0.18)', tint: 'rgba(180, 195, 220, 0.75)'},
};

const FAMILY_LABEL = {
  'sc-metal': 'SC metal',
  'junction': 'Junction electrode',
  'junction-core': 'Tunnel barrier',
  'substrate': 'Bulk',
};

export default function Anatomy() {
  const [hovered, setHovered] = useState(null);

  // SVG geometry
  const VBW = 1100;
  const VBH = 660;
  const PLATE_W = 460;
  const PLATE_LEFT = VBW / 2 - PLATE_W / 2 - 40;
  const SKEW_X = 38;
  const SKEW_Y = -12;
  const STACK_TOP = 80;
  const LAYER_GAP = 60;
  const LAYER_HEIGHT = 38;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-28 pb-20 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="font-mono text-[10px] tracking-[0.32em] uppercase text-primary mb-5">
              <span className="inline-flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary" style={{ boxShadow: '0 0 8px var(--primary)' }} />
                anatomy · superconducting qubit
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-[1.05]">
              Seven layers between silicon
              <br />
              <span className="gradient-text">and a working qubit.</span>
            </h1>
            <p className="font-body text-muted-foreground mt-6 leading-relaxed">
              Each layer fights a different noise channel. Pick the wrong material at any
              one of them and your error budget is gone.
            </p>
          </motion.div>

          {/* Stack + label grid */}
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* The chip stack */}
            <div className="lg:col-span-7">
              <div className="glass rounded-2xl p-6 relative">
                <svg
                  viewBox={`0 0 ${VBW} ${VBH}`}
                  className="w-full h-auto"
                  aria-label="Seven-layer superconducting qubit chip stack"
                >
                  <defs>
                    {/* Iridescent gradient for the tunnel barrier */}
                    <linearGradient id="irid-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%"   stopColor="#ff8ad3" />
                      <stop offset="25%"  stopColor="#a78bfa" />
                      <stop offset="50%"  stopColor="#7dd3fc" />
                      <stop offset="75%"  stopColor="#86efac" />
                      <stop offset="100%" stopColor="#fcd34d" />
                    </linearGradient>
                    <linearGradient id="irid-fill" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%"   stopColor="rgba(255, 138, 211, 0.22)" />
                      <stop offset="25%"  stopColor="rgba(167, 139, 250, 0.22)" />
                      <stop offset="50%"  stopColor="rgba(125, 211, 252, 0.22)" />
                      <stop offset="75%"  stopColor="rgba(134, 239, 172, 0.22)" />
                      <stop offset="100%" stopColor="rgba(252, 211, 77, 0.22)" />
                    </linearGradient>
                    <pattern id="bg-grid-anat" width="48" height="48" patternUnits="userSpaceOnUse">
                      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(214, 220, 228, 0.04)" strokeWidth="1" />
                    </pattern>
                  </defs>

                  <rect x="0" y="0" width={VBW} height={VBH} fill="url(#bg-grid-anat)" />

                  {/* Seven layers, top → bottom */}
                  {LAYERS.map((layer, i) => {
                    const y = STACK_TOP + i * LAYER_GAP;
                    const colors = FAMILY_COLOR[layer.family];
                    const isHov = hovered === layer.id;
                    const isDim = hovered !== null && !isHov;
                    const lift = (i - 3) * 4; // mild fan around the tunnel barrier (index 3)

                    const left = PLATE_LEFT;
                    const right = PLATE_LEFT + PLATE_W;
                    const sklx = left + SKEW_X;
                    const skrx = right + SKEW_X;
                    const skly = y + SKEW_Y;
                    const skry = y + SKEW_Y;
                    const bottom = y + LAYER_HEIGHT;
                    const skbry = bottom + SKEW_Y;

                    return (
                      <g
                        key={layer.id}
                        onMouseEnter={() => setHovered(layer.id)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          transform: `translateY(${lift}px)`,
                          transition: 'transform 0.35s ease, filter 0.25s ease, opacity 0.25s ease',
                          opacity: isDim ? 0.3 : 1,
                          filter: isHov
                            ? `drop-shadow(0 0 14px ${colors.glow}) drop-shadow(0 0 28px ${colors.glow})`
                            : `drop-shadow(0 0 8px ${colors.glow})`,
                          cursor: 'pointer',
                        }}
                      >
                        {/* Right side (depth face) */}
                        <polygon
                          points={`${right},${y} ${skrx},${skry} ${skrx},${skbry} ${right},${bottom}`}
                          fill={colors.fill}
                          stroke={colors.stroke}
                          strokeWidth={isHov ? 1.6 : 1}
                          strokeOpacity="0.6"
                        />
                        {/* Top face */}
                        <polygon
                          points={`${left},${y} ${right},${y} ${skrx},${skry} ${sklx},${skly}`}
                          fill={colors.fill}
                          stroke={colors.stroke}
                          strokeWidth={isHov ? 2 : 1.2}
                        />
                        {/* Front band */}
                        <rect
                          x={left}
                          y={y}
                          width={PLATE_W}
                          height={LAYER_HEIGHT}
                          fill={colors.fill}
                          stroke={colors.stroke}
                          strokeWidth={isHov ? 2 : 1.2}
                        />
                      </g>
                    );
                  })}

                  {/* Pulsing qubit dot above the stack */}
                  <g>
                    <circle cx={PLATE_LEFT + PLATE_W / 2} cy={STACK_TOP - 18} r={6} fill="hsl(191, 97%, 55%)">
                      <animate attributeName="r" values="6;9;6" dur="2.4s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={PLATE_LEFT + PLATE_W / 2} cy={STACK_TOP - 18} r={14} fill="none" stroke="hsl(191, 97%, 55%)" strokeOpacity="0.5" strokeWidth="1">
                      <animate attributeName="r" values="12;22;12" dur="2.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" />
                    </circle>
                  </g>
                </svg>

                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground text-center mt-4">
                  <span style={{ color: 'rgba(214,220,228,0.95)' }}>silver</span> = SC metal · {' '}
                  <span style={{ color: 'hsl(191, 97%, 55%)' }}>cyan</span> = JJ electrodes · {' '}
                  <span style={{
                    background: 'linear-gradient(90deg, #ff8ad3, #a78bfa, #7dd3fc, #86efac, #fcd34d)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}>iridescent</span> = AlOₓ barrier · {' '}
                  <span style={{ color: 'rgba(180,195,220,0.85)' }}>slate</span> = substrate
                </div>
              </div>
            </div>

            {/* Layer cards on the side */}
            <div className="lg:col-span-5">
              <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground mb-4">
                layer ledger (top → bottom)
              </div>
              <div className="space-y-2">
                {LAYERS.map((layer) => {
                  const colors = FAMILY_COLOR[layer.family];
                  const isHov = hovered === layer.id;
                  const isDim = hovered !== null && !isHov;
                  return (
                    <div
                      key={layer.id}
                      onMouseEnter={() => setHovered(layer.id)}
                      onMouseLeave={() => setHovered(null)}
                      className={`glass rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 border ${
                        isHov ? 'border-primary/40' : 'border-border/40'
                      }`}
                      style={{
                        opacity: isDim ? 0.45 : 1,
                        boxShadow: isHov ? `0 0 18px ${colors.glow}` : 'none',
                      }}
                    >
                      <div className="flex items-baseline gap-3">
                        <span
                          className="font-mono text-[11px] tracking-[0.22em]"
                          style={{ color: colors.tint }}
                        >
                          {layer.n}
                        </span>
                        <span className="font-display text-sm font-semibold text-foreground">
                          {layer.label}
                        </span>
                        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                          {FAMILY_LABEL[layer.family]}
                        </span>
                      </div>
                      <div className="font-mono text-xs mt-1.5" style={{ color: colors.tint }}>
                        {layer.material}
                        {' · '}
                        <span className="text-muted-foreground">{layer.thickness}</span>
                      </div>
                      {isHov && (
                        <div className="text-xs mt-2 leading-snug text-muted-foreground">
                          {layer.property}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* The takeaway — Layer 3 today, all layers in time */}
          <div className="mt-16 glass rounded-2xl p-8 border-primary/20">
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-primary mb-3">
              what arqitec does with this stack
            </div>
            <div className="font-display text-2xl font-bold text-foreground max-w-3xl">
              For now, the engine designs <span className="gradient-text">Layer 3 — the Josephson junction base</span>. The same engine runs against any layer in the stack as we extend the scope.
            </div>
            <p className="font-body text-muted-foreground mt-4 leading-relaxed max-w-3xl">
              Layer 3 is where today's noise budget is decided — Cooper pairs in, a clean Al
              electrode with a well-behaved native oxide. The THRML sampler, the GNN refinement,
              and the EM validator are layer-agnostic by design: turn the same loop on Layer 2,
              Layer 4, or the substrate and it optimizes the fab spec there too.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

