import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Atom, Cpu, Snowflake, Target as TargetIcon, Check, Trophy, TriangleAlert, ShieldCheck, X, CornerDownRight, Gauge, FlaskConical } from "lucide-react";
import { Panel, SectionHeader, MetricCard } from "@/components/qa/primitives";
import { cn } from "@/lib/utils";
import {
  CONTROL_OPTIONS,
  CRYO_OPTIONS,
  QUBIT_TYPE_FAMILIES,
  TARGETS,
  materialsForNode,
  needsQEC,
  qubitNodeById,
  runWorkflow,
  type ControlHardware,
} from "@/lib/qa/codesign";
import { MATERIALS_META } from "@/lib/qa/materials-data";

export const Route = createFileRoute("/_app/codesign")({
  head: () => ({ meta: [{ title: "Co-Design Selector — Q-Architect" }, { name: "description", content: "Input → hardware constraints → material library → QEC matching → best material + code." }] }),
  component: CodesignPage,
});

const FAMILY_ACCENT: Record<string, string> = { violet: "text-violet", green: "text-neon-green", amber: "text-amber", cyan: "text-cyan" };
const byId = (list: ControlHardware[], id: string) => list.find((h) => h.id === id) ?? list[0];

const BUDGETS = [
  { label: "50", value: 50 }, { label: "100", value: 100 }, { label: "150", value: 150 },
  { label: "200", value: 200 }, { label: "250", value: 250 }, { label: "300", value: 300 },
];

const fmtN = (n: number | null | undefined) => (n === null || n === undefined ? "—" : Number.isFinite(n) ? Math.round(n).toLocaleString() : "∞");
function fmtTime(s: number | null): string {
  if (s === null) return "—";
  if (s < 1e-3) return `${(s * 1e6).toFixed(0)} µs`;
  if (s < 1) return `${(s * 1e3).toFixed(0)} ms`;
  if (s < 60) return `${s.toFixed(1)} s`;
  if (s < 3600) return `${(s / 60).toFixed(1)} min`;
  if (s < 86400) return `${(s / 3600).toFixed(1)} h`;
  const yr = s / 3.15e7;
  if (yr < 1) return `${(s / 86400).toFixed(1)} days`;
  if (yr < 1e4) return `${yr.toFixed(yr < 10 ? 1 : 0)} yr`;
  return `${yr.toExponential(1)} yr`;
}

function CodesignPage() {
  const [qubitNodeId, setQubitNodeId] = useState("transmon");
  const [controlId, setControlId] = useState(CONTROL_OPTIONS[0].id);
  const [cryoId, setCryoId] = useState(CRYO_OPTIONS.find((c) => c.category === "dilution-refrigerator")?.id ?? CRYO_OPTIONS[0].id);
  const [targetId, setTargetId] = useState("memory-demo");
  const [maxPhysical, setMaxPhysical] = useState(200);

  const node = qubitNodeById(qubitNodeId);
  const control = byId(CONTROL_OPTIONS, controlId);
  const cryo = byId(CRYO_OPTIONS, cryoId);
  const target = TARGETS.find((t) => t.id === targetId) ?? TARGETS[0];

  const wf = useMemo(() => runWorkflow(node, control, cryo, target, maxPhysical), [node, control, cryo, target, maxPhysical]);
  const { constraints, output } = wf;
  const confColor = output.confidence === "high" ? "text-neon-green" : output.confidence === "medium" ? "text-amber" : "text-danger";

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Co-Design Workflow"
        title="Input → Constraints → Materials → QEC Matching → Output"
        description="Pick the stack; Q-Architect derives hardware constraints, runs the (material × code) matching engine, and returns the best material + code — or the target spec for a new material when nothing fits."
      />

      {/* ============================ INPUT LAYER ============================ */}
      <LayerLabel n="1" title="Input layer" />
      <Panel className="mb-3" title="Step 1" subtitle="Qubit type — full superconducting taxonomy" action={<Atom className="h-3.5 w-3.5 text-cyan" />}>
        <div className="p-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUBIT_TYPE_FAMILIES.map((fam) => (
            <div key={fam.id}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn("text-xs font-semibold", FAMILY_ACCENT[fam.accent])}>{fam.label}</span>
                <span className="mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{fam.regime}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {fam.types.map((t) => {
                  const count = materialsForNode(t).length;
                  return (
                    <Chip key={t.id} active={qubitNodeId === t.id} onClick={() => setQubitNodeId(t.id)}
                      title={t.label} sub={count > 0 ? `${count} materials` : "no materials"}
                      nested={Boolean(t.parentId)} muted={count === 0} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <StepPanel n={2} title="Control hardware (FPGA)" icon={<Cpu className="h-3.5 w-3.5 text-violet" />}>
          {CONTROL_OPTIONS.map((c) => (
            <Chip key={c.id} active={controlId === c.id} onClick={() => setControlId(c.id)}
              title={c.name} sub={`${c.vendor}${c.realTimeDecoding ? " · RT-decode" : ""}`} />
          ))}
        </StepPanel>
        <StepPanel n={3} title="Cryostat" icon={<Snowflake className="h-3.5 w-3.5 text-neon-blue" />}>
          {CRYO_OPTIONS.map((c) => (
            <Chip key={c.id} active={cryoId === c.id} onClick={() => setCryoId(c.id)}
              title={c.name} sub={`${c.vendor} · ${c.operatingTempK < 1 ? `${(c.operatingTempK * 1000).toFixed(0)} mK` : `${c.operatingTempK} K`}`} />
          ))}
        </StepPanel>
        <StepPanel n={4} title="Target · logical error" icon={<TargetIcon className="h-3.5 w-3.5 text-amber" />}>
          {TARGETS.map((t) => (
            <Chip key={t.id} active={targetId === t.id} onClick={() => setTargetId(t.id)}
              title={t.name} sub={`p_L ${t.logicalErrorTarget.toExponential(0)} · ${t.logicalQubits} logical${needsQEC(t) ? "" : " · no QEC"}`} />
          ))}
        </StepPanel>
        <StepPanel n={5} title="Target · max physical qubits" icon={<Gauge className="h-3.5 w-3.5 text-cyan" />}>
          <div className="grid grid-cols-3 gap-1.5">
            {BUDGETS.map((b) => (
              <button key={b.label} onClick={() => setMaxPhysical(b.value)}
                className={cn("rounded-md border px-2 py-2 mono text-xs transition", maxPhysical === b.value ? "border-cyan/50 bg-cyan/10 text-cyan" : "border-border/60 bg-surface-2/30 text-muted-foreground hover:text-foreground")}>
                {b.label}
              </button>
            ))}
          </div>
          <div className="mono text-[10px] text-muted-foreground mt-1.5">budget: {Number.isFinite(maxPhysical) ? maxPhysical.toLocaleString() : "unlimited"} physical qubits</div>
        </StepPanel>
      </div>

      {/* ====================== HARDWARE CONSTRAINTS LAYER ====================== */}
      <LayerLabel n="2" title="Hardware constraints layer" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
        <MetricCard label="Gate-time floor" value={constraints.gateTimeFloorNs} unit="ns" tone="neutral" hint={`from ${control.name}`} />
        <MetricCard label="Measurement latency" value={constraints.measurementLatencyNs} unit="ns" tone="neutral" />
        <MetricCard label="Thermal floor" value={(constraints.thermalFloorK * 1000).toFixed(0)} unit="mK" tone={constraints.thermalPenalty > 0.1 ? "warn" : "good"} hint={cryo.name} />
        <MetricCard label="Thermal penalty" value={`${(constraints.thermalPenalty * 100).toFixed(0)}`} unit="%" tone={constraints.thermalPenalty > 0.1 ? "warn" : "good"} />
        <MetricCard label="QEC cycle time" value={constraints.cycleTimeNs} unit="ns" tone="neutral" hint={constraints.realTimeDecoding ? "RT-decode ✓" : "no RT-decode"} />
      </div>

      {/* ====================== QEC MATCHING ENGINE ====================== */}
      <LayerLabel n="3" title="Material library + QEC matching engine — (material × code)" />
      <Panel className="mb-4" title="Possible materials × codes" subtitle="Real materials ranked by relevancy (within budget, then footprint)"
        action={<span className="mono text-[10px] text-muted-foreground inline-flex items-center gap-1"><FlaskConical className="h-3 w-3 text-cyan" /> {wf.materials.length} materials × 5 codes · {MATERIALS_META.source}</span>}>
        {wf.pairs.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">No catalogue material for {node.label} — see the new-material spec below.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mono">
                <tr className="border-b border-border/60">
                  <th className="text-left px-4 py-2.5">#</th>
                  <th className="text-left px-4 py-2.5">Material</th>
                  <th className="text-left px-4 py-2.5">Role · MP</th>
                  <th className="text-left px-4 py-2.5">Code</th>
                  <th className="text-right px-4 py-2.5">d</th>
                  <th className="text-right px-4 py-2.5">Total physical</th>
                  <th className="text-right px-4 py-2.5">Wall-clock</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {wf.pairs.slice(0, 16).map((p, i) => (
                  <tr key={`${p.material.id}-${p.code.id}`} className={cn("border-b border-border/40 last:border-0 hover:bg-surface-2/40", !p.feasible && "opacity-55")}>
                    <td className="px-4 py-2.5 mono text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2.5 text-foreground">{p.material.name}</td>
                    <td className="px-4 py-2.5 text-[11px] text-muted-foreground">
                      {p.material.role}
                      {p.material.mpId && <span className="mono text-cyan"> · {p.material.mpId}</span>}
                      {p.material.crystalSystem && <span> · {p.material.crystalSystem}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-violet mono text-xs">{p.code.name}</td>
                    <td className="px-4 py-2.5 text-right mono">{p.distance !== null ? p.distance.toFixed(1) : "—"}</td>
                    <td className="px-4 py-2.5 text-right mono text-cyan">{fmtN(p.totalPhysical)}</td>
                    <td className="px-4 py-2.5 text-right mono text-muted-foreground">{fmtTime(p.wallClockS)}</td>
                    <td className="px-4 py-2.5">
                      {p.feasible && p.withinBudget ? (
                        <span className="inline-flex items-center gap-1 mono text-[10px] text-neon-green"><Check className="h-3 w-3" /> in budget</span>
                      ) : p.feasible ? (
                        <span className="inline-flex items-center gap-1 mono text-[10px] text-amber"><TriangleAlert className="h-3 w-3" /> over budget</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 mono text-[10px] text-danger" title={p.reason}><X className="h-3 w-3" /> {p.reason}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* ====================== OUTPUT LAYER ====================== */}
      <LayerLabel n="4" title="Output" />
      <div className={cn("rounded-lg border px-5 py-4 mb-3 flex items-start gap-3",
        output.mode === "existing" ? "border-neon-green/30 bg-neon-green/5" : output.mode === "new-material" ? "border-cyan/30 bg-cyan/5" : "border-amber/30 bg-amber/5")}>
        <div className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-md border shrink-0",
          output.mode === "existing" ? "bg-neon-green/15 border-neon-green/40" : "bg-cyan/15 border-cyan/40")}>
          {output.mode === "existing" ? <Trophy className="h-4 w-4 text-neon-green" /> : <FlaskConical className="h-4 w-4 text-cyan" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Recommendation</span>
            <span className={cn("mono text-[10px] uppercase tracking-[0.18em]", confColor)}>· {output.confidence} confidence</span>
          </div>
          <div className="mt-0.5 text-sm text-foreground">{output.headline}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        {output.best && (
          <Panel title="Best material + code" subtitle={`${output.best.material.name} · ${output.best.code.name}`}
            action={output.best.material.mpId ? <span className="mono text-[10px] text-cyan">{output.best.material.mpId}</span> : undefined}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
              <MetricCard label="Code distance" value={output.best.distance?.toFixed(1) ?? "—"} tone="neutral" />
              <MetricCard label="Physical qubits" value={fmtN(output.best.totalPhysical)} tone={output.best.withinBudget ? "good" : "warn"} hint={`${fmtN(output.best.perLogical)}/logical`} />
              <MetricCard label="Wall-clock" value={fmtTime(output.best.wallClockS)} tone="neutral" />
              <MetricCard label="Effective p₂q" value={`${(output.best.effectiveP2q * 100).toFixed(2)}`} unit="%" tone="warn" />
              <MetricCard label="η (bias)" value={output.best.material.biasEta} tone="neutral" />
              <MetricCard label="Within budget" value={output.best.withinBudget ? "yes" : "no"} tone={output.best.withinBudget ? "good" : "warn"} />
            </div>
            <div className="border-t border-border/60 px-4 py-2.5 flex flex-wrap items-center gap-1.5 mono text-[10px] text-muted-foreground">
              <span className="rounded border border-border/60 bg-surface-2/50 px-1.5 py-0.5">role: {output.best.material.role}</span>
              {output.best.material.crystalSystem && <span className="rounded border border-border/60 bg-surface-2/50 px-1.5 py-0.5">{output.best.material.crystalSystem}</span>}
              {output.best.material.density !== null && <span className="rounded border border-border/60 bg-surface-2/50 px-1.5 py-0.5">ρ {output.best.material.density?.toFixed(1)} g/cm³</span>}
              {output.best.material.isMetal !== null && <span className="rounded border border-border/60 bg-surface-2/50 px-1.5 py-0.5">{output.best.material.isMetal ? "metal" : `gap ${output.best.material.bandGap?.toFixed(1)} eV`}</span>}
              <span className="text-muted-foreground/70">via Materials Project</span>
            </div>
          </Panel>
        )}
        {output.newSpec && (
          <Panel title="Target spec for a NEW material" subtitle="What a device would need to fit the budget"
            action={<span className="mono text-[10px] text-muted-foreground inline-flex items-center gap-1"><FlaskConical className="h-3 w-3 text-cyan" /> synthesized</span>}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
              <MetricCard label="Max 2Q error" value={output.newSpec.maxTwoQubitError.toFixed(3)} unit="%" tone="warn" />
              <MetricCard label="Min T1" value={fmtN(output.newSpec.minT1Us)} unit="µs" tone="good" />
              <MetricCard label="Min T2" value={fmtN(output.newSpec.minT2Us)} unit="µs" tone="good" />
              <MetricCard label="Min bias η" value={output.newSpec.minBiasEta} tone="neutral" />
              <MetricCard label="Code" value={output.newSpec.code} tone="neutral" />
              <MetricCard label="Distance / phys-log" value={`d=${output.newSpec.distance} · ${fmtN(output.newSpec.perLogical)}`} tone="neutral" />
            </div>
          </Panel>
        )}
        {output.mode !== "existing" && !output.newSpec && (
          <Panel title="Budget too small for a material spec" subtitle="Even a distance-3 code does not fit">
            <div className="p-4 text-[12px] text-muted-foreground leading-relaxed">
              A budget of <span className="text-foreground mono">{Number.isFinite(maxPhysical) ? maxPhysical.toLocaleString() : "∞"}</span> physical qubits cannot host
              {" "}<span className="text-foreground mono">{target.logicalQubits.toLocaleString()}</span> logical qubits — the smallest (distance-3) code already needs
              {" "}≈<span className="text-foreground mono">{(target.logicalQubits * 17).toLocaleString()}</span> qubits. Raise the budget to get a concrete new-material spec.
            </div>
          </Panel>
        )}
      </div>

      <Panel title="Confidence & caveats" subtitle="Model assumptions and constraints"
        action={<span className={cn("mono text-[11px] uppercase tracking-[0.18em] inline-flex items-center gap-1", confColor)}><ShieldCheck className="h-3 w-3" /> {output.confidence}</span>}>
        <ul className="p-4 space-y-1.5">
          {output.caveats.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber/70 shrink-0" />
              {c}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function LayerLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-1">
      <span className="flex h-5 w-5 items-center justify-center rounded mono text-[10px] bg-cyan/15 border border-cyan/40 text-cyan">{n}</span>
      <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{title}</span>
      <span className="h-px flex-1 bg-border/50" />
    </div>
  );
}

function StepPanel({ n, title, icon, children }: { n: number; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Panel title={`Step ${n}`} subtitle={title} action={icon}>
      <div className="p-3 flex flex-col gap-1.5">{children}</div>
    </Panel>
  );
}

function Chip({ active, onClick, title, sub, nested, muted }: { active: boolean; onClick: () => void; title: string; sub: string; nested?: boolean; muted?: boolean }) {
  return (
    <button onClick={onClick}
      className={cn("text-left rounded-md border px-3 py-2 transition", nested && "ml-3",
        active ? "border-cyan/50 bg-cyan/10" : "border-border/60 bg-surface-2/30 hover:bg-surface-2/60", muted && !active && "opacity-70")}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-sm flex items-center gap-1", active ? "text-cyan font-medium" : "text-foreground")}>
          {nested && <CornerDownRight className="h-3 w-3 text-muted-foreground" />}
          {title}
        </span>
        {active && <Check className="h-3.5 w-3.5 text-cyan shrink-0" />}
      </div>
      <div className={cn("mono text-[10px] mt-0.5", muted ? "text-muted-foreground/60" : "text-muted-foreground")}>{sub}</div>
    </button>
  );
}
