import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ComposedChart, Line, Scatter, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Cpu, ServerCog, ArrowRight, TriangleAlert } from "lucide-react";
import { Panel, SectionHeader, MetricCard } from "@/components/qa/primitives";
import { cn } from "@/lib/utils";
import {
  ADVANTAGE_RECORDS,
  ADVANTAGE_HARDWARE,
  ADVANTAGE_GAIN,
  ADVANTAGE_META,
} from "@/lib/qa/advantage-data";

export const Route = createFileRoute("/_app/advantage")({
  head: () => ({ meta: [{ title: "Quantum vs Classical — ArQiteQ" }, { name: "description", content: "Quantum error correction: classically simulating a noisy surface-code memory vs running it on a QPU." }] }),
  component: AdvantagePage,
});

const physPerLogical = (d: number) => 2 * d * d - 1;

function AdvantagePage() {
  const records = ADVANTAGE_RECORDS;
  const hw = ADVANTAGE_HARDWARE;
  const gain = ADVANTAGE_GAIN;

  const timeData: Record<string, number | undefined>[] = records.map((r) => ({
    physical_qubits: r.physical_qubits,
    "Classical exact sim": r.classical_exact_time_s,
    "Classical Stim (stabilizer)": r.classical_stim_time_s,
    "Quantum (projected QPU)": r.qpu_projected_time_s,
  }));
  if (hw) {
    timeData.push({ physical_qubits: physPerLogical(hw.distance), hardware: hw.wallclock_s });
  }

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Quantum vs Classical · Quantum Error Correction"
        title="Simulate QEC classically, or run it on a QPU"
        description={`The task is a surface-code memory: keep one logical qubit alive for d rounds (${ADVANTAGE_META.material} noise). Exactly simulating the noisy device scales as 2ⁿ in physical qubits; a QPU runs the d syndrome rounds natively in microseconds. Quality = logical-error suppression Λ.`}
        action={
          <Link to="/results" className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface-2/50 px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-3/70 transition mono uppercase tracking-[0.14em]">
            FT crossover <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard label={`Classical sim speedup @ n=${gain.atQubits}`} value={`${gain.speedup.toExponential(0)}×`} tone="good" hint="exact sim / projected QPU" />
        <MetricCard label={`Classical exact sim @ n=${gain.atQubits}`} value={`${gain.classicalTimeS.toExponential(1)}`} unit="s" tone="bad" hint="intractable" />
        <MetricCard label="Projected QPU time" value={`${(gain.qpuTimeS * 1e6).toFixed(0)}`} unit="µs" tone="good" hint={`${gain.atDistance} rounds × ${ADVANTAGE_META.cycleTimeUs}µs`} />
        <MetricCard label="Mean suppression Λ" value={gain.meanLambda} tone={gain.meanLambda > 1.5 ? "good" : "warn"} hint="per +2 distance" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Time-to-solution: classical sim vs QPU" subtitle="Surface-code memory · log scale">
          <div className="p-3 h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="oklch(0.32 0.03 255 / 0.3)" vertical={false} />
                <XAxis type="number" dataKey="physical_qubits" tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} label={{ value: "physical qubits  n = 2d²−1", position: "insideBottom", offset: -4, fill: "oklch(0.68 0.03 250)", fontSize: 10 }} domain={["dataMin", "dataMax"]} />
                <YAxis scale="log" domain={["auto", "auto"]} tickFormatter={(v: number) => v.toExponential(0)} tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.22 0.025 252)", border: "1px solid oklch(0.3 0.03 255 / 0.6)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 11 }} />
                <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                <Line type="monotone" dataKey="Classical exact sim" stroke="oklch(0.7 0.22 25)" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                <Line type="monotone" dataKey="Classical Stim (stabilizer)" stroke="oklch(0.82 0.16 75)" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                <Line type="monotone" dataKey="Quantum (projected QPU)" stroke="oklch(0.82 0.16 200)" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                <Scatter dataKey="hardware" fill="oklch(0.78 0.18 150)" name="Real IBM hardware" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Logical-error suppression (the QEC win)" subtitle={`Λ ≈ ${gain.meanLambda} per +2 distance`}>
          <div className="p-3 h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={records} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="oklch(0.32 0.03 255 / 0.3)" vertical={false} />
                <XAxis dataKey="d" tickFormatter={(v: number) => `d=${v}`} tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis scale="log" domain={["auto", "auto"]} tickFormatter={(v: number) => v.toExponential(0)} tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => v.toExponential(2)} contentStyle={{ background: "oklch(0.22 0.025 252)", border: "1px solid oklch(0.3 0.03 255 / 0.6)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 11 }} />
                <Line type="monotone" dataKey="logical_error_per_round" name="Logical error / round" stroke="oklch(0.7 0.21 295)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Panel className="xl:col-span-1" title="Ran on real hardware" subtitle={hw ? `${hw.backend} · ${hw.code}` : "not yet submitted"}
          action={<span className="mono text-[10px] uppercase tracking-[0.18em] text-neon-green inline-flex items-center gap-1"><ServerCog className="h-3 w-3" /> IBM Quantum</span>}>
          {hw ? (
            <div className="p-4 grid grid-cols-2 gap-3">
              <MetricCard label="Backend" value={hw.backend} tone="neutral" />
              <MetricCard label="Code" value={hw.code} tone="neutral" />
              <MetricCard label="Wall-clock" value={hw.wallclock_s} unit="s" tone="good" />
              <MetricCard label="Shots" value={hw.shots} tone="neutral" />
              <MetricCard label="Logical err/round" value={hw.logical_error_per_round.toExponential(2)} tone="good" />
              <MetricCard label="Physical err/round" value={hw.physical_error_per_round.toExponential(2)} tone="warn" />
              <div className="col-span-2 mono text-[10px] text-muted-foreground break-all">job {hw.job_id}</div>
            </div>
          ) : (
            <div className="p-6 text-sm text-muted-foreground text-center">
              <Cpu className="h-6 w-6 mx-auto mb-2 opacity-60" />
              No real-hardware QEC run cached yet. Run
              <code className="mx-1 rounded bg-surface-2/70 px-1.5 py-0.5 mono text-[11px]">python -m qec_pipeline.qec_advantage --hardware</code>
              to run a repetition-code memory on IBM; logical vs physical error is cached and shown here.
            </div>
          )}
        </Panel>

        <Panel className="xl:col-span-2" title="Per-distance measurements" subtitle="Stim + PyMatching surface-code memory">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mono">
                <tr className="border-b border-border/60">
                  <th className="text-left px-4 py-2.5">d</th>
                  <th className="text-right px-4 py-2.5">Phys. qubits</th>
                  <th className="text-right px-4 py-2.5">LER / round</th>
                  <th className="text-right px-4 py-2.5">Λ</th>
                  <th className="text-right px-4 py-2.5">Classical exact (s)</th>
                  <th className="text-right px-4 py-2.5">Stim (s)</th>
                  <th className="text-right px-4 py-2.5">QPU (s)</th>
                </tr>
              </thead>
              <tbody className="mono tabular-nums">
                {records.map((r) => (
                  <tr key={r.d} className="border-b border-border/40 last:border-0 hover:bg-surface-2/40">
                    <td className="px-4 py-2.5 text-foreground">{r.d}</td>
                    <td className="px-4 py-2.5 text-right">{r.physical_qubits}</td>
                    <td className="px-4 py-2.5 text-right text-violet">{r.logical_error_per_round.toExponential(2)}</td>
                    <td className={cn("px-4 py-2.5 text-right", r.lambda_suppression > 1 ? "text-neon-green" : "text-muted-foreground")}>{r.lambda_suppression}</td>
                    <td className="px-4 py-2.5 text-right text-danger">{r.classical_exact_time_s.toExponential(1)}</td>
                    <td className="px-4 py-2.5 text-right text-amber">{r.classical_stim_time_s.toFixed(3)}</td>
                    <td className="px-4 py-2.5 text-right text-cyan">{r.qpu_projected_time_s.toExponential(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="mt-4 rounded-lg border border-amber/30 bg-gradient-to-r from-amber/10 via-transparent to-transparent px-5 py-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-amber/20 border border-amber/40 shrink-0">
          <TriangleAlert className="h-4 w-4 text-amber" />
        </div>
        <div className="text-sm text-foreground/90 leading-relaxed">
          <span className="mono text-[10px] uppercase tracking-[0.2em] text-amber">Honest framing</span>
          <p className="mt-1">
            Caveat (Gottesman-Knill): an <em>idealized stabilizer</em> QEC circuit is efficiently classically simulable — that's exactly why <span className="text-amber">Stim</span> stays cheap here. The exponential <span className="text-danger">classical exact</span> curve is the cost of full state-vector / density-matrix simulation of the <span className="text-foreground">noisy, non-Clifford</span> device. The durable point: a QPU performs error correction <span className="text-cyan">natively</span> in real time and delivers the suppression Λ shown — and the economics of getting there are set by material choice, see the
            {" "}<Link to="/results" className="text-cyan hover:underline">fault-tolerant crossover</Link> and the
            {" "}<Link to="/surface-code" className="text-cyan hover:underline">surface-code dashboard</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
