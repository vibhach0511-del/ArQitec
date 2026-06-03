import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

const QEC_CODES = ['Surface Code', 'Toric Code', 'Floquet Code', 'Repetition Code', 'Color Code'];
const ERROR_RATES = ['10⁻³', '10⁻⁴', '10⁻⁵', '10⁻⁶', '10⁻⁷'];
const QUBIT_TYPES = ['Transmon', 'Fluxonium', 'Cat qubit'];
const ALGORITHMS = ['VQE 10 electrons', 'Shor RSA-2048', 'Quantum simulation', 'Custom'];

// ─── Mapping from React form values to optimizer-iframe values ───────
// The optimizer's <select> options use lowercase short keys; our form
// shows human labels. If a label has no underlying option (e.g.
// "Floquet Code") we just omit the field — the listener silently
// keeps the optimizer's default for that select.
const QUBIT_TYPE_MAP = {
  Transmon: 'transmon',
  Fluxonium: 'fluxonium',
  'Cat qubit': 'cat',
};
const QEC_CODE_MAP = {
  'Surface Code': 'surface',
  'Toric Code': 'toric',
  'Color Code': '2d_color',
  // Floquet / Repetition codes are not native options in v2 — left
  // out so the listener falls through to the optimizer's default.
};
const ERROR_RATE_MAP = {
  '10⁻³': 1e-3,
  '10⁻⁴': 1e-4,
  '10⁻⁵': 1e-5,
  '10⁻⁶': 1e-6,
  '10⁻⁷': 1e-7,
};

function buildPrefillPayload(form) {
  return {
    type: 'arqitec:prefill',
    qubitType: QUBIT_TYPE_MAP[form.qubitType],
    qecCode: QEC_CODE_MAP[form.code],
    targetError: ERROR_RATE_MAP[form.errorRate],
    qecDistance: 5,
    // For future use — algorithm + qubit budget aren't yet wired into
    // any optimizer control, but we forward them so the bridge sees them.
    algorithm: form.targetAlgorithm,
    qubitBudget: form.qubits ? Number(form.qubits) : undefined,
  };
}

export default function Design() {
  const [form, setForm] = useState({ code: '', errorRate: '', qubits: '', qubitType: 'Transmon', targetAlgorithm: 'VQE 10 electrons', notes: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const iframeRef = useRef(null);

  // Push the current form values into the iframe. Called from the iframe's
  // onLoad handler so it fires once the optimizer's own scripts have wired
  // up the message listener.
  const sendPrefill = () => {
    const win = iframeRef.current && iframeRef.current.contentWindow;
    if (!win) return;
    win.postMessage(buildPrefillPayload(form), '*');
  };

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

              {/* Qubit type */}
              <div className="glass rounded-2xl p-6">
                <label className="block font-mono text-xs text-primary tracking-widest uppercase mb-4">
                  Qubit Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {QUBIT_TYPES.map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, qubitType: t }))}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium font-body transition-all duration-200 text-center ${
                        form.qubitType === t
                          ? 'border-primary bg-primary/10 text-primary glow-cyan'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target algorithm */}
              <div className="glass rounded-2xl p-6">
                <label className="block font-mono text-xs text-primary tracking-widest uppercase mb-4">
                  Target Algorithm
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ALGORITHMS.map(a => (
                    <button
                      key={a} type="button"
                      onClick={() => setForm(f => ({ ...f, targetAlgorithm: a }))}
                      className={`px-3 py-3 rounded-xl border text-sm font-medium font-body transition-all duration-200 text-center ${
                        form.targetAlgorithm === a
                          ? 'border-primary bg-primary/10 text-primary glow-cyan'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
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
              className="glass rounded-2xl p-6 border-primary/30"
            >
              {/* Parameter summary above the optimizer */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <div className="font-display text-lg font-bold text-foreground">Junction doping optimizer</div>
                  <p className="font-mono text-[11px] text-muted-foreground/80 mt-1">
                    {form.code} · {form.errorRate} · {form.qubitType} · {form.targetAlgorithm}
                  </p>
                </div>
                <button
                  onClick={() => { setSubmitted(false); setForm({ code: '', errorRate: '', qubits: '', qubitType: 'Transmon', targetAlgorithm: 'VQE 10 electrons', notes: '' }); }}
                  className="px-4 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                >
                  ← Start another design
                </button>
              </div>

              {/* The actual optimizer — full-bleed iframe. Form values are
                  postMessage'd in on load so the optimizer pre-configures. */}
              <div className="rounded-xl overflow-hidden border border-border/60 bg-background">
                <iframe
                  ref={iframeRef}
                  src="/junction_doping_optimizer_v2.html"
                  title="Junction Doping Optimizer"
                  className="w-full"
                  style={{ height: '85vh', border: 0, display: 'block' }}
                  onLoad={sendPrefill}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}