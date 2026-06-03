import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

const QEC_CODES = ['Surface Code', 'Toric Code', 'Floquet Code', 'Repetition Code', 'Color Code'];
const ERROR_RATES = ['10⁻³', '10⁻⁴', '10⁻⁵', '10⁻⁶', '10⁻⁷'];

export default function Design() {
  const [form, setForm] = useState({ code: '', errorRate: '', qubits: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background grid-overlay">
      <Navbar />

      <div className="relative pt-28 pb-20">
        {/* BG Orb */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-mono text-xs text-primary tracking-widest uppercase mb-3">
              · Chip Designer ·
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-3">
              Define your <span className="gradient-text">QEC target</span>
            </h1>
            <p className="font-body text-muted-foreground text-sm leading-relaxed mb-10">
              Specify your quantum error correction code and logical error rate. ArQitec returns the optimal material stack, doping profile, and fabrication parameters.
            </p>
          </motion.div>

          {!submitted ? (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-5"
            >
              {/* QEC Code */}
              <div className="glass rounded-2xl p-6">
                <label className="block font-mono text-xs text-primary tracking-widest uppercase mb-4">
                  QEC Architecture
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {QEC_CODES.map(code => (
                    <button
                      key={code} type="button"
                      onClick={() => setForm(f => ({ ...f, code }))}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium font-body transition-all duration-200 text-left ${
                        form.code === code
                          ? 'border-primary bg-primary/10 text-primary glow-cyan'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Rate */}
              <div className="glass rounded-2xl p-6">
                <label className="block font-mono text-xs text-primary tracking-widest uppercase mb-4">
                  Target Logical Error Rate
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {ERROR_RATES.map(rate => (
                    <button
                      key={rate} type="button"
                      onClick={() => setForm(f => ({ ...f, errorRate: rate }))}
                      className={`px-3 py-3 rounded-xl border text-sm font-mono transition-all duration-200 text-center ${
                        form.errorRate === rate
                          ? 'border-primary bg-primary/10 text-primary glow-cyan'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {rate}
                    </button>
                  ))}
                </div>
              </div>

              {/* Qubit count */}
              <div className="glass rounded-2xl p-6">
                <label className="block font-mono text-xs text-primary tracking-widest uppercase mb-4">
                  Physical Qubit Budget
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={form.qubits}
                  onChange={e => setForm(f => ({ ...f, qubits: e.target.value }))}
                  className="w-full bg-background/60 border border-border rounded-xl px-4 py-3 font-mono text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>

              {/* Notes */}
              <div className="glass rounded-2xl p-6">
                <label className="block font-mono text-xs text-primary tracking-widest uppercase mb-4">
                  Additional Constraints <span className="text-muted-foreground normal-case font-body">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Foundry constraints, material preferences, operating temperature..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-background/60 border border-border rounded-xl px-4 py-3 font-body text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!form.code || !form.errorRate || loading}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm tracking-wide hover:bg-primary/90 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed glow-cyan"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating recipe...
                  </>
                ) : (
                  <>
                    Generate fabrication recipe
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="glass rounded-2xl p-10 text-center border-primary/30"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">⚛</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">Recipe queued</h2>
              <p className="font-body text-sm text-muted-foreground mb-2">
                Your fabrication recipe for <strong className="text-primary">{form.code}</strong> at{' '}
                <strong className="text-primary">{form.errorRate}</strong> is being computed.
              </p>
              <p className="font-mono text-xs text-muted-foreground/60">
                Estimated delivery: &lt;48 hours · Results via email
              </p>
              <button
                onClick={() => { setSubmitted(false); setForm({ code: '', errorRate: '', qubits: '', notes: '' }); }}
                className="mt-8 px-6 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
              >
                Start another design
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}