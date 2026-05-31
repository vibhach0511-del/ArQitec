import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Check, X, Sparkles, FlaskConical, ShieldCheck } from "lucide-react";
import { Panel, SectionHeader, MetricRow, DeltaPill, MetricCard } from "@/components/qa/primitives";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useQA } from "@/lib/qa/store";
import { CODE_CHARACTERISTICS, ERROR_CORRECTION_CODES } from "@/lib/qa/data";
import {
  CHARACTERISTIC_META,
  FIT_WEIGHT_META,
  buildSummaryTable,
  codeFitScore,
  generateRequiredMaterial,
  matchCode,
  rankMaterials,
} from "@/lib/qa/code-designer";
import type { CharacteristicKey, CodeCharacteristics } from "@/lib/qa/types";

export const Route = createFileRoute("/_app/code-designer")({
  head: () => ({ meta: [{ title: "Code Designer — ArQiteQ" }, { name: "description", content: "Inverse QEC design: dial a code's characteristics and find the material it requires." }] }),
  component: CodeDesignerPage,
});

const SHORT_AXIS: Record<CharacteristicKey, string> = {
  thresholdPct: "Threshold",
  logicalErrorFloor: "Log. floor",
  distance: "Distance",
  qubitOverhead: "Overhead",
  connectivityDegree: "Connectivity",
  syndromeOverhead: "Syndrome",
  decoderComplexity: "Decoder",
  biasCompatibility: "Bias compat",
  crosstalkSensitivity: "Crosstalk",
  manufacturabilityFit: "Mfg fit",
};

function normTo100(key: CharacteristicKey, value: number) {
  const m = CHARACTERISTIC_META.find((x) => x.key === key)!;
  return Math.max(0, Math.min(100, ((value - m.min) / (m.max - m.min)) * 100));
}

function CodeDesignerPage() {
  const qa = useQA();
  const [target, setTarget] = useState<CodeCharacteristics>(() => ({ ...CODE_CHARACTERISTICS.surface }));

  const matched = useMemo(() => matchCode(target), [target]);
  const spec = useMemo(() => generateRequiredMaterial(target), [target]);
  const ranked = useMemo(() => rankMaterials(spec), [spec]);
  const fit = useMemo(
    () => codeFitScore(matched.codeId, qa.material, qa.topology, qa.workload),
    [matched.codeId, qa.material, qa.topology, qa.workload],
  );
  const summary = useMemo(() => buildSummaryTable(), []);

  const radarData = CHARACTERISTIC_META.map((m) => ({
    axis: SHORT_AXIS[m.key],
    Target: Math.round(normTo100(m.key, target[m.key])),
    [matched.code.name]: Math.round(normTo100(m.key, CODE_CHARACTERISTICS[matched.codeId][m.key])),
  }));

  const setChar = (key: CharacteristicKey, value: number) =>
    setTarget((t) => ({ ...t, [key]: value }));

  const loadPreset = (id: string) =>
    setTarget({ ...CODE_CHARACTERISTICS[id as keyof typeof CODE_CHARACTERISTICS] });

  const fitRows: { label: string; value: number; weight: number }[] = [
    { label: "Logical fidelity", value: fit.logicalFidelityScore, weight: FIT_WEIGHT_META.logicalFidelity },
    { label: "Topology match", value: fit.topologyMatchScore, weight: FIT_WEIGHT_META.topologyMatch },
    { label: "Qubit overhead", value: fit.qubitOverheadScore, weight: FIT_WEIGHT_META.qubitOverhead },
    { label: "Syndrome latency", value: fit.syndromeLatencyScore, weight: FIT_WEIGHT_META.syndromeLatency },
    { label: "Decoder complexity", value: fit.decoderComplexityScore, weight: FIT_WEIGHT_META.decoderComplexity },
    { label: "Noise-bias match", value: fit.noiseBiasMatchScore, weight: FIT_WEIGHT_META.noiseBiasMatch },
    { label: "Manufacturability", value: fit.manufacturabilityScore, weight: FIT_WEIGHT_META.manufacturability },
  ];

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Code Designer · inverse QEC"
        title="Code → required material"
        description="Treat each error-correction code as an engineering option. Dial the 10 characteristics to define a target code, then see the closest known code, the material it requires, and the real materials that fit best."
        action={
          <label className="flex items-center gap-2 mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Load preset
            <select
              onChange={(e) => loadPreset(e.target.value)}
              defaultValue="surface"
              className="appearance-none rounded-md border border-border/70 bg-surface-2/60 px-2.5 py-1.5 text-foreground focus:outline-none hover:text-cyan transition"
            >
              {ERROR_CORRECTION_CODES.map((c) => (
                <option key={c.id} value={c.id} className="bg-surface-2">{c.name}</option>
              ))}
            </select>
          </label>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Sliders */}
        <Panel className="col-span-12 xl:col-span-5" title="Target code characteristics" subtitle="Dial the engineering tradeoffs">
          <div className="p-4 space-y-4">
            {CHARACTERISTIC_META.map((m) => (
              <div key={m.key}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-foreground/90">{m.label}</span>
                  <span className="mono tabular-nums text-cyan">
                    {target[m.key]}<span className="text-muted-foreground"> {m.unit}</span>
                  </span>
                </div>
                <Slider
                  value={[target[m.key]]}
                  min={m.min}
                  max={m.max}
                  step={m.step}
                  onValueChange={(v) => setChar(m.key, v[0])}
                />
                <div className="mt-1 text-[10px] text-muted-foreground/70 leading-tight">{m.hint}</div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Right column */}
        <div className="col-span-12 xl:col-span-7 space-y-4">
          {/* Matched code + radar */}
          <Panel title="Closest known code" subtitle={`${matched.code.name} · ${matched.code.family}`}
            action={<DeltaPill value={`${matched.similarity}% match`} />}>
            <div className="grid md:grid-cols-2 gap-3 p-3">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid stroke="oklch(0.32 0.03 255 / 0.5)" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                    <Tooltip contentStyle={{ background: "oklch(0.22 0.025 252)", border: "1px solid oklch(0.3 0.03 255 / 0.6)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                    <Radar name="Target" dataKey="Target" stroke="oklch(0.82 0.16 200)" fill="oklch(0.82 0.16 200)" fillOpacity={0.22} />
                    <Radar name={matched.code.name} dataKey={matched.code.name} stroke="oklch(0.7 0.21 295)" fill="oklch(0.7 0.21 295)" fillOpacity={0.18} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Code similarity ranking</div>
                {matched.ranking.map((r) => (
                  <div key={r.id} className={cn("flex items-center gap-2", r.id === matched.codeId && "text-cyan")}>
                    <div className="flex-1 h-1.5 rounded-full bg-surface-3/80 overflow-hidden">
                      <div className={cn("h-full rounded-full", r.id === matched.codeId ? "bg-cyan" : "bg-violet/70")} style={{ width: `${r.similarity}%` }} />
                    </div>
                    <span className="mono text-[10px] tabular-nums w-28 truncate">{r.name}</span>
                    <span className="mono text-[10px] tabular-nums text-muted-foreground w-10 text-right">{r.similarity}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* Generated required material */}
          <Panel title="Generated required material" subtitle="The material this code profile demands"
            action={<span className="mono text-[10px] text-muted-foreground inline-flex items-center gap-1"><FlaskConical className="h-3 w-3" /> synthesized</span>}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3">
              <MetricCard label="Max 2Q error" value={spec.maxTwoQubitError} unit="%" tone="warn" />
              <MetricCard label="Max 1Q error" value={spec.maxOneQubitError} unit="%" tone="warn" />
              <MetricCard label="Min T1" value={spec.minT1Us} unit="µs" tone="good" />
              <MetricCard label="Min T2" value={spec.minT2Us} unit="µs" tone="good" />
              <MetricCard label="Required bias η" value={spec.requiredBiasEta <= 1 ? "any" : `≥ ${spec.requiredBiasEta}`} tone={spec.requiredBiasEta > 1 ? "warn" : "neutral"} />
              <MetricCard label="Max crosstalk" value={spec.maxCrosstalk} tone="neutral" />
              <MetricCard label="Required degree" value={spec.requiredDegree} tone="neutral" />
              <MetricCard label="Target pL" value={spec.targetLogicalError.toExponential(0)} tone="good" />
            </div>
          </Panel>

          {/* Ranked real materials */}
          <Panel title="Closest real materials" subtitle="Ranked against the required spec">
            <div className="p-3 space-y-2.5">
              {ranked.map((mf, i) => (
                <div key={mf.material.id} className={cn("rounded-md border p-3", i === 0 ? "border-cyan/40 bg-cyan/5" : "border-border/60 bg-surface-2/30")}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {i === 0 && <Sparkles className="h-3.5 w-3.5 text-cyan shrink-0" />}
                      <span className="text-sm text-foreground truncate">{mf.material.name}</span>
                      {i === 0 && <DeltaPill value="BEST FIT" />}
                    </div>
                    <span className={cn("mono text-sm tabular-nums shrink-0", mf.fit > 80 ? "text-neon-green" : mf.fit > 55 ? "text-amber" : "text-danger")}>{mf.fit}<span className="text-muted-foreground text-xs">/100</span></span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{mf.verdict}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {mf.gaps.map((g) => (
                      <span key={g.axis} className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 mono text-[9px]", g.ok ? "border-neon-green/30 bg-neon-green/10 text-neon-green" : "border-danger/30 bg-danger/10 text-danger")}>
                        {g.ok ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                        {g.axis}: {g.detail}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* CodeFitScore breakdown */}
          <Panel title="CodeFitScore" subtitle={`${matched.code.name} on ${qa.material.short} · ${qa.topology.name} · ${qa.workload.name}`}
            action={<span className={cn("mono text-lg font-semibold tabular-nums", fit.total > 70 ? "text-neon-green" : "text-amber")}>{fit.total}<span className="text-xs text-muted-foreground">/100</span></span>}>
            <div className="border-t border-border/60">
              {fitRows.map((r) => (
                <MetricRow key={r.label} label={`${r.label} · w=${r.weight}`} value={r.value} bar={r.value} tone="cyan" />
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Hero summary table */}
      <Panel className="mt-4" title="Recommendation matrix" subtitle="Workload → Material → Topology → Best QEC code"
        action={<span className="mono text-[10px] text-muted-foreground inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-cyan" /> highest CodeFitScore per workload</span>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mono">
              <tr className="border-b border-border/60">
                <th className="text-left px-4 py-2.5">Workload</th>
                <th className="text-left px-4 py-2.5">Material</th>
                <th className="text-left px-4 py-2.5">Topology</th>
                <th className="text-left px-4 py-2.5">Best QEC code</th>
                <th className="text-right px-4 py-2.5">Logical fidelity</th>
                <th className="text-right px-4 py-2.5">Qubit overhead</th>
                <th className="text-left px-4 py-2.5">Reason</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <tr key={row.workload} className="border-b border-border/40 last:border-0 hover:bg-surface-2/40 align-top">
                  <td className="px-4 py-2.5 text-foreground">{row.workload}</td>
                  <td className="px-4 py-2.5 mono text-cyan">{row.material}</td>
                  <td className="px-4 py-2.5 mono text-foreground/90">{row.topology}</td>
                  <td className="px-4 py-2.5 text-violet">{row.code}</td>
                  <td className="px-4 py-2.5 text-right mono tabular-nums text-neon-green">{row.logicalFidelity}</td>
                  <td className="px-4 py-2.5 text-right mono tabular-nums">{row.qubitOverhead}</td>
                  <td className="px-4 py-2.5 text-[11px] text-muted-foreground max-w-md">{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
