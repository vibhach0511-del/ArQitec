import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Cpu, Layers, Zap, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ChipVisualizer from '@/components/ChipVisualizer';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] } }),
};

const stats = [
  { value: '10⁻⁶', label: 'Logical Error Rate', sub: 'achievable threshold' },
  { value: '~40ns', label: 'Gate Time', sub: 'T1 / T2 optimized' },
  { value: '99.8%', label: 'Gate Fidelity', sub: 'two-qubit operations' },
  { value: '<48h', label: 'Turnaround', sub: 'full material spec' },
];

const features = [
  {
    icon: Cpu,
    title: 'Material Spec from First Principles',
    desc: 'Set a QEC code and a logical error rate target. ArQitec computes the exact superconductor stack — doping, thickness, annealing — that satisfies it.',
  },
  {
    icon: Layers,
    title: 'Complete Deposition Output',
    desc: 'Receive T1, T2, anharmonicity, and interface quality targets in a single fab-ready document your foundry can act on immediately.',
  },
  {
    icon: Zap,
    title: 'Code-Native Optimization',
    desc: 'Surface, Toric, Floquet — each code has a distinct error model. The solver understands the threshold behaviour of every major QEC architecture.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background grid-overlay">
      <Navbar />

      {/* Hero — split layout */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[110px] pointer-events-none" />

        <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — copy */}
            <div>
              {/* Badge */}
              <motion.div
                variants={fadeUp} initial="hidden" animate="show" custom={0}
                className="inline-flex items-center gap-2 mb-8"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-xs text-primary tracking-widest uppercase">
                  QEC · Superconductor · Fabrication
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp} initial="hidden" animate="show" custom={1}
                className="font-display text-5xl sm:text-6xl lg:text-5xl xl:text-6xl font-bold leading-[1.08] tracking-tight mb-5"
              >
                A material spec<br />
                <span className="gradient-text">built around your<br />error budget.</span>
              </motion.h1>

              {/* Description */}
              <motion.p
                variants={fadeUp} initial="hidden" animate="show" custom={2}
                className="font-body text-base text-muted-foreground leading-relaxed max-w-lg mb-3"
              >
                Choose a QEC code. Set a logical error rate. ArQitec derives the superconductor doping pattern, T1&nbsp;/&nbsp;T2&nbsp;/&nbsp;η targets, and exact deposition parameters — a complete, foundry-ready recipe.
              </motion.p>

              <motion.p
                variants={fadeUp} initial="hidden" animate="show" custom={2.5}
                className="font-body text-sm text-muted-foreground/60 leading-relaxed max-w-lg mb-10"
              >
                No more iterating material choices and hoping the code threshold holds. The physics works backward from what you need.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeUp} initial="hidden" animate="show" custom={3}
                className="flex flex-wrap items-center gap-4"
              >
                <Link
                  to="/design"
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm tracking-wide hover:bg-primary/90 transition-all duration-300 glow-cyan"
                >
                  Design a chip
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/why"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl glass text-foreground/70 font-medium text-sm tracking-wide hover:text-primary hover:border-primary/30 transition-all duration-300"
                >
                  How it works
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>

            {/* Right — chip visualizer */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="show" custom={2}
              className="relative h-[520px] lg:h-[580px]"
            >
              <ChipVisualizer />
            </motion.div>
          </div>

          {/* Stats row */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={5}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-20"
          >
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUp} initial="hidden" animate="show" custom={5 + i * 0.4}
                className="glass rounded-2xl p-5 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="font-mono text-2xl sm:text-3xl font-bold text-primary mb-1">
                  {s.value}
                </div>
                <div className="font-body text-sm font-medium text-foreground/80">{s.label}</div>
                <div className="font-mono text-xs text-muted-foreground mt-0.5">{s.sub}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }} viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="font-mono text-xs text-primary tracking-widest uppercase mb-3">
              · What it does ·
            </p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Precision, from target<br />
              <span className="gradient-text">to deposition.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.15 }} viewport={{ once: true }}
                className="glass rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 group cursor-default"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-3">{f.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }} viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden glass border border-primary/20 p-12 sm:p-16 text-center"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
            <p className="font-mono text-xs text-primary tracking-widest uppercase mb-4">· Ready to start ·</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Your material spec,<br />
              <span className="gradient-text">in 48 hours.</span>
            </h2>
            <p className="font-body text-muted-foreground max-w-xl mx-auto mb-8 text-sm leading-relaxed">
              Provide a QEC code and a logical error rate target. ArQitec returns a complete superconductor material specification, validated against your foundry constraints.
            </p>
            <Link
              to="/design"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm tracking-wide hover:bg-primary/90 transition-all glow-cyan"
            >
              Start designing <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono text-xs text-muted-foreground tracking-widest">
            © 2026 ArQitec
          </span>
          <span className="font-mono text-xs text-muted-foreground/40 tracking-wide">
            Quantum Error Correction → Fabrication
          </span>
        </div>
      </footer>
    </div>
  );
}