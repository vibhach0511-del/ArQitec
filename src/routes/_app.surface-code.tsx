import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { Gauge, Sparkles, Check, X, Trophy } from "lucide-react";
import { Panel, SectionHeader, MetricCard } from "@/components/qa/primitives";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  DECODERS,
  THRESHOLD,
  THRESHOLD_PCT,
  WILLOW_CITATION,
  WILLOW_DATA,
  WILLOW_LAMBDA,
  decoderKeepsUp,
  decoderLatencyNs,
  logicalErrorPerCycle,
  magicStateOverhead,
  physicalPerLogical,
  requiredDistance,
  suppressionLambda,
  totalPhysical,
} from "@/lib/qa/surface-code";

export const Route = createFileRoute("/_app/surface-code")({
  head: () => ({ meta: [{ title: "Surface Code — Q-Architect" }, { name: "description", content: "Surface-code dashboard: distance vs overhead, the 1% threshold, decoders, magic-state distillation, and the Willow 2024 milestone." }] }),
  component: SurfaceCodePage,
});

const fmt = (n: number) => n.toLocaleString();

function SurfaceCodePage() {
  const [d, setD] = useState(11);
  const [nLogical, setNLogical] = useState(100);
  const [pPct, setPPct] = useState(0.3); // physical error rate, %
  const [cycleNs, setCycleNs] = useState(1000);
  const [factories, setFactories] = useState(10);

  const p = pPct / 100;
  const perLogical = physicalPerLogical(d);
  const totalData = totalPhysical(d, nLogical);
  const ler = logicalErrorPerCycle(d, p);
  const lambda = suppressionLambda(p);
  const belowThreshold = p < THRESHOLD;

  // Trade-off chart: physical qubits + logical error vs distance.
  const tradeoff = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const dd = 3 + i * 2;
        return {
          d: dd,
          physical: physicalPerLogical(dd),
          ler: logicalErrorPerCycle(dd, p),
        };
      }),
    [p],
  );

  // Threshold crossover: LER vs d at several physical error rates.
  const thresholdSeries = useMemo(() => {
    const ps = [0.003, 0.005, 0.01, 0.015];
    return Array.from({ length: 12 }, (_, i) => {
      const dd = 3 + i * 2;
      const row: Record<string, number> = { d: dd };
      for (const pp of ps) row[`${(pp * 100).toFixed(1)}%`] = logicalErrorPerCycle(dd, pp);
      return row;
    });
  }, []);

  // Decoder latency vs distance.
  const decoderSeries = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const dd = 3 + i * 2;
        return {
          d: dd,
          MWPM: decoderLatencyNs(dd, "mwpm"),
          "Union-Find": decoderLatencyNs(dd, "union-find"),
          Neural: decoderLatencyNs(dd, "neural"),
        };
      }),
    [],
  );

  const distill = magicStateOverhead(d, nLogical, factories);
  const footprint = [
    { name: "Footprint", "Data qubits": distill.dataQubits, "Distillation factories": distill.factoryQubits },
  ];

  // Full-stack escalation for the famous d=25 / 1000-logical example.
  const exampleD = 25;
  const exampleN = 1000;
  const exampleBare = totalPhysical(exampleD, exampleN);
  const exampleFull = 60_000_000;

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Surface Code · fault-tolerance dashboard"
        title="Distance, overhead, threshold & the T-gate tax"
        description="The surface code's core engineering tradeoffs. Increasing distance d exponentially suppresses logical error — but only below the ~1% threshold, and at a steep physical-qubit cost dominated in practice by magic-state distillation."
      />

      {/* Headline trade-off cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard label={`Physical / logical (d=${d})`} value={fmt(perLogical)} unit="qubits" tone="neutral" hint="2d²−1" />
        <MetricCard label={`Total data (${nLogical} logical)`} value={fmt(totalData)} unit="qubits" tone="warn" />
        <MetricCard label="Logical error / cycle" value={ler.toExponential(2)} tone={belowThreshold ? "good" : "bad"} hint={`p=${pPct}%`} />
        <MetricCard label="Suppression Λ / +2d" value={lambda.toFixed(2)} tone={lambda > 1 ? "good" : "bad"} hint={belowThreshold ? "below threshold" : "ABOVE threshold"} />
      </div>

      {/* Controls */}
      <Panel className="mb-4" title="Controls" subtitle="Drive every panel below">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-x-6 gap-y-4 p-4">
          <SliderRow label="Code distance d" value={d} unit="" min={3} max={51} step={2} onChange={setD} />
          <SliderRow label="Logical qubits" value={nLogical} unit="" min={1} max={2000} step={1} onChange={setNLogical} />
          <SliderRow label="Physical error rate" value={pPct} unit="%" min={0.1} max={3} step={0.1} onChange={setPPct} accent={p < THRESHOLD ? "cyan" : "danger"} />
          <SliderRow label="QEC cycle time" value={cycleNs} unit="ns" min={200} max={5000} step={100} onChange={setCycleNs} />
          <SliderRow label="Parallel T-factories" value={factories} unit="" min={1} max={60} step={1} onChange={setFactories} />
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* 1. Central trade-off */}
        <Panel title="The central trade-off" subtitle="Physical qubits & logical error vs distance">
          <div className="p-3 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tradeoff} margin={{ top: 16, right: 48, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="oklch(0.32 0.03 255 / 0.3)" vertical={false} />
                <XAxis dataKey="d" tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="q" tick={{ fill: "oklch(0.82 0.16 200)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="e" orientation="right" scale="log" domain={["auto", "auto"]} tickFormatter={(v: number) => v.toExponential(0)} tick={{ fill: "oklch(0.7 0.21 295)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.22 0.025 252)", border: "1px solid oklch(0.3 0.03 255 / 0.6)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 11 }} />
                <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                <Line yAxisId="q" type="monotone" dataKey="physical" name="Physical / logical" stroke="oklch(0.82 0.16 200)" strokeWidth={2} dot={false} />
                <Line yAxisId="e" type="monotone" dataKey="ler" name="Logical error / cycle" stroke="oklch(0.7 0.21 295)" strokeWidth={2} dot={false} />
                <ReferenceLine yAxisId="q" x={d} stroke="oklch(0.78 0.18 150)" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="border-t border-border/60 px-4 py-3 text-[11px] text-muted-foreground leading-relaxed">
            Example: <span className="text-foreground">{exampleN.toLocaleString()} logical qubits @ d={exampleD}</span> = {" "}
            <span className="text-cyan mono">{fmt(exampleBare)}</span> bare data qubits (2·25²−1 each). With magic-state factories + routing, full-stack estimates reach <span className="text-amber mono">~{fmt(exampleFull)}</span> — see the distillation panel.
          </div>
        </Panel>

        {/* 2. Threshold */}
        <Panel title="The error threshold (~1%)" subtitle="Below it more qubits help; above it they hurt">
          <div className="p-3 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={thresholdSeries} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="oklch(0.32 0.03 255 / 0.3)" vertical={false} />
                <XAxis dataKey="d" tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis scale="log" domain={["auto", "auto"]} tickFormatter={(v: number) => v.toExponential(0)} tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.22 0.025 252)", border: "1px solid oklch(0.3 0.03 255 / 0.6)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 11 }} />
                <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                <Line type="monotone" dataKey="0.3%" stroke="oklch(0.78 0.18 150)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="0.5%" stroke="oklch(0.82 0.16 200)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="1.0%" stroke="oklch(0.82 0.16 75)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="1.5%" stroke="oklch(0.7 0.22 25)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="border-t border-border/60 px-4 py-3 text-[11px] text-muted-foreground leading-relaxed">
            At <span className="text-amber mono">{THRESHOLD_PCT}%</span> the curve is flat (no benefit from d). Above it (1.5%, red) logical error <span className="text-danger">grows</span> with d. Most superconducting platforms are now comfortably below threshold.
          </div>
        </Panel>

        {/* 3. Decoder bottleneck */}
        <Panel title="The decoder bottleneck" subtitle={`Decode latency vs ${cycleNs} ns cycle budget`}>
          <div className="p-3 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={decoderSeries} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="oklch(0.32 0.03 255 / 0.3)" vertical={false} />
                <XAxis dataKey="d" tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis scale="log" domain={["auto", "auto"]} tickFormatter={(v: number) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}µs` : `${v.toFixed(0)}ns`}`} tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.22 0.025 252)", border: "1px solid oklch(0.3 0.03 255 / 0.6)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 11 }} />
                <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                <ReferenceLine y={cycleNs} stroke="oklch(0.78 0.18 150)" strokeDasharray="4 4" label={{ value: "cycle budget", fill: "oklch(0.78 0.18 150)", fontSize: 9, position: "insideTopRight" }} />
                <Line type="monotone" dataKey="MWPM" stroke="oklch(0.7 0.22 25)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Union-Find" stroke="oklch(0.82 0.16 200)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Neural" stroke="oklch(0.7 0.21 295)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="border-t border-border/60 px-4 py-2.5 flex flex-wrap gap-2">
            {DECODERS.map((dec) => {
              const ok = decoderKeepsUp(d, dec.kind, cycleNs);
              return (
                <span key={dec.kind} className={cn("inline-flex items-center gap-1 rounded border px-2 py-1 mono text-[10px]", ok ? "border-neon-green/30 bg-neon-green/10 text-neon-green" : "border-danger/30 bg-danger/10 text-danger")}>
                  {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {dec.label} @ d={d}: {decoderLatencyNs(d, dec.kind).toFixed(0)}ns
                </span>
              );
            })}
          </div>
        </Panel>

        {/* 4. Magic state distillation */}
        <Panel title="Magic-state distillation (the T-gate tax)" subtitle="Surface code is Clifford-only; T gates need factories">
          <div className="p-3 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={footprint} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="oklch(0.32 0.03 255 / 0.3)" horizontal={false} />
                <XAxis type="number" tickFormatter={(v: number) => `${(v / 1e6).toFixed(1)}M`} tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "oklch(0.22 0.025 252)", border: "1px solid oklch(0.3 0.03 255 / 0.6)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 11 }} />
                <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                <Bar dataKey="Data qubits" stackId="a" fill="oklch(0.82 0.16 200)" radius={[4, 0, 0, 4]} />
                <Bar dataKey="Distillation factories" stackId="a" fill="oklch(0.7 0.21 295)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="border-t border-border/60 grid grid-cols-3 gap-3 p-3">
            <MetricCard label="Factory footprint" value={`${(distill.factoryFraction * 100).toFixed(0)}`} unit="%" tone={distill.factoryFraction > 0.5 ? "warn" : "neutral"} />
            <MetricCard label="Factory qubits" value={fmt(distill.factoryQubits)} tone="neutral" hint={`d_f=${distill.factoryDistance}`} />
            <MetricCard label="T-factories" value={distill.factories} tone="neutral" hint="15-to-1 each" />
          </div>
        </Panel>
      </div>

      {/* 5. Willow milestone */}
      <Panel className="mt-4" title="Experimental high-water mark — Google Willow (2024)" subtitle="Exponential suppression confirmed across d = 3 → 7"
        action={<span className="mono text-[10px] uppercase tracking-[0.18em] text-neon-green inline-flex items-center gap-1"><Trophy className="h-3 w-3" /> Λ ≈ {WILLOW_LAMBDA}</span>}>
        <div className="grid md:grid-cols-3 gap-3 p-3">
          <div className="md:col-span-2 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WILLOW_DATA} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="oklch(0.32 0.03 255 / 0.3)" vertical={false} />
                <XAxis dataKey="d" tickFormatter={(v: number) => `d=${v}`} tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis scale="log" domain={["auto", "auto"]} tickFormatter={(v: number) => `${v}%`} tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => `${v}% / cycle`} contentStyle={{ background: "oklch(0.22 0.025 252)", border: "1px solid oklch(0.3 0.03 255 / 0.6)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 11 }} />
                <Bar dataKey="errorPerCyclePct" radius={[4, 4, 0, 0]}>
                  {WILLOW_DATA.map((_, i) => <Cell key={i} fill="oklch(0.78 0.18 150)" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center gap-2 text-sm">
            <div className="flex items-center gap-2 text-foreground"><Sparkles className="h-4 w-4 text-cyan" /> Each +2 distance cut logical error by <span className="mono text-cyan">{WILLOW_LAMBDA}×</span>.</div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              First demonstration of true exponential error suppression with scale — the milestone the field pursued for two decades. Confirms operation below the surface-code threshold.
            </p>
            <p className="text-[10px] text-muted-foreground/70 mono leading-snug border-t border-border/40 pt-2">{WILLOW_CITATION}</p>
          </div>
        </div>
      </Panel>

      {/* Honesty / context note */}
      <div className="mt-4 rounded-lg border border-border/60 bg-surface-1/60 px-5 py-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-cyan/15 border border-cyan/30 shrink-0">
          <Gauge className="h-4 w-4 text-cyan" />
        </div>
        <div className="text-[12px] text-muted-foreground leading-relaxed">
          <span className="mono text-[10px] uppercase tracking-[0.2em] text-cyan">Why this matters</span>
          <p className="mt-1">
            The surface code's reliability is a tug-of-war: distance <span className="text-foreground">d</span> suppresses logical error exponentially (only below threshold), but the <span className="text-foreground">2d²−1</span> overhead and — above all — the magic-state distillation tax set the real physical-qubit budget. Decoders must also keep pace with ~1µs cycles, which is why union-find and neural decoders matter. Models here are illustrative; calibrate with the Stim pipeline in <span className="mono">qec_pipeline</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

function SliderRow({ label, value, unit, min, max, step, onChange, accent = "cyan" }: {
  label: string; value: number; unit: string; min: number; max: number; step: number; onChange: (v: number) => void; accent?: "cyan" | "danger";
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-foreground/90">{label}</span>
        <span className={cn("mono tabular-nums", accent === "danger" ? "text-danger" : "text-cyan")}>
          {value}<span className="text-muted-foreground"> {unit}</span>
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}
