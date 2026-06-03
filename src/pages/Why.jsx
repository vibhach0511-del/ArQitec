import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';

const steps = [
  {
    num: '01',
    title: 'Select your QEC code',
    desc: 'Choose from Surface, Toric, Floquet, or any major QEC architecture. ArQitec understands each code\'s unique error model and threshold behaviour.',
  },
  {
    num: '02',
    title: 'Set your logical error rate',
    desc: 'Define the target logical error rate for your computation. This drives the entire material optimization — from T1/T2 budgets down to interface quality.',
  },
  {
    num: '03',
    title: 'Inverse material solve',
    desc: 'Our physics engine back-propagates through the device model, solving for the superconductor doping, deposition thickness, and annealing profile that satisfies your constraints.',
  },
  {
    num: '04',
    title: 'Receive the fab spec',
    desc: 'Get a complete, fab-ready document: material stack, deposition parameters, predicted T1 / T2 / η, and a checklist for your foundry partner.',
  },
];

const comparisons = [
  { label: 'Starting point', old: 'Available material', new: 'QEC target & error rate' },
  { label: 'Design loop', old: 'Forward simulation', new: 'Inverse optimization' },
  { label: 'Output', old: 'Code compatibility guess', new: 'Exact fab recipe' },
  { label: 'Time to spec', old: 'Weeks of iteration', new: '< 48 hours' },
];

export default function Why() {
  return (
    <div className="min-h-screen bg-background grid-overlay">
      <Navbar />

      <div className="relative pt-28 pb-20">
        <div className="absolute top-1/3 left-0 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <p className="font-mono text-xs text-primary tracking-widest uppercase mb-3">
              · The Method ·
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-5">
              How ArQitec <span className="gradient-text">works</span>
            </h1>
            <p className="font-body text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
              Most quantum hardware teams start with what their fab can produce, then search for a code that fits. ArQitec inverts this — defining the desired quantum outcome and deriving the material recipe.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="space-y-5 mb-24">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }} viewport={{ once: true }}
                className="glass rounded-2xl p-7 flex gap-7 items-start hover:border-primary/25 transition-all duration-300 group"
              >
                <div className="font-mono text-4xl font-bold text-primary/20 group-hover:text-primary/40 transition-colors leading-none mt-1 min-w-[3rem]">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Comparison table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }} viewport={{ once: true }}
            className="mb-20"
          >
            <p className="font-mono text-xs text-primary tracking-widest uppercase mb-6 text-center">
              · Traditional vs ArQitec ·
            </p>
            <div className="glass rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 border-b border-border/50 px-6 py-3">
                <span className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest">Dimension</span>
                <span className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest">Traditional</span>
                <span className="font-mono text-xs text-primary uppercase tracking-widest">ArQitec</span>
              </div>
              {comparisons.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-3 px-6 py-4 ${i < comparisons.length - 1 ? 'border-b border-border/30' : ''} hover:bg-white/2 transition-colors`}
                >
                  <span className="font-body text-sm text-muted-foreground">{row.label}</span>
                  <span className="font-body text-sm text-foreground/50 line-through decoration-muted-foreground/30">{row.old}</span>
                  <span className="font-body text-sm text-primary font-medium">{row.new}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} viewport={{ once: true }}
            className="text-center"
          >
            <Link
              to="/design"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm tracking-wide hover:bg-primary/90 transition-all glow-cyan"
            >
              Start your first design <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}