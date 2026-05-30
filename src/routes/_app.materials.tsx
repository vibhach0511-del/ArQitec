import { createFileRoute } from "@tanstack/react-router";
import { MATERIAL_PROFILES, QUBIT_FAMILIES } from "@/lib/qa/data";
import { Panel, SectionHeader, MetricCard } from "@/components/qa/primitives";
import { Atom, Snowflake, Sparkles, Check, CornerDownRight } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { useQA } from "@/lib/qa/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Accent, MaterialProfile } from "@/lib/qa/types";

export const Route = createFileRoute("/_app/materials")({
  head: () => ({ meta: [{ title: "Materials & Process — Q-Architect" }, { name: "description", content: "Superconducting-qubit taxonomy: charge, flux, and phase qubit families." }] }),
  component: MaterialsPage,
});

const ACCENT_TEXT: Record<Accent, string> = {
  cyan: "text-cyan",
  violet: "text-violet",
  green: "text-neon-green",
  amber: "text-amber",
};
const ACCENT_BORDER: Record<Accent, string> = {
  cyan: "border-cyan/40",
  violet: "border-violet/40",
  green: "border-neon-green/40",
  amber: "border-amber/40",
};

const SHORT_BY_ID = Object.fromEntries(MATERIAL_PROFILES.map((m) => [m.id, m.short]));

function MaterialsPage() {
  const qa = useQA();

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Superconducting-qubit taxonomy"
        title="Josephson-junction qubit families"
        description="Superconducting qubits organized by their Josephson regime — Charge (EJ ≪ EC), Flux (EJ ≫ EC), and Phase (large current-biased junction). Select any qubit to drive every metric across the workspace. Values are illustrative, calibrated to the literature."
      />

      <div className="space-y-8">
        {QUBIT_FAMILIES.map((fam) => {
          const members = MATERIAL_PROFILES.filter((m) => m.family === fam.id);
          return (
            <section key={fam.id}>
              <div className="flex items-center gap-3 mb-3">
                <span className={cn("inline-block h-5 w-1 rounded-full border-l-4", ACCENT_BORDER[fam.accent])} />
                <h2 className="text-lg font-semibold text-foreground">{fam.label}</h2>
                <span className={cn("mono text-[11px] uppercase tracking-[0.18em]", ACCENT_TEXT[fam.accent])}>{fam.regime}</span>
                <span className="mono text-[10px] text-muted-foreground">{members.length} qubits</span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-2">
                {members.map((m) => (
                  <MaterialCard
                    key={m.id}
                    m={m}
                    active={qa.config.materialId === m.id}
                    accent={fam.accent}
                    onSelect={() => {
                      qa.setMaterial(m.id);
                      toast.success("Profile selected", { description: m.name });
                    }}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function MaterialCard({ m, active, accent, onSelect }: { m: MaterialProfile; active: boolean; accent: Accent; onSelect: () => void }) {
  const isVariant = Boolean(m.parent);
  return (
    <Panel
      className={cn(active && "ring-1 ring-cyan/50", isVariant && cn("border-l-2", ACCENT_BORDER[accent]))}
      title={m.short}
      subtitle={m.name}
      action={<span className="mono text-[10px] uppercase tracking-[0.18em] text-cyan">{m.vendor}</span>}
    >
      {(isVariant || m.regimeLabel) && (
        <div className="flex items-center gap-2 px-4 pt-2.5 mono text-[10px]">
          {isVariant && (
            <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5", ACCENT_BORDER[accent], ACCENT_TEXT[accent])}>
              <CornerDownRight className="h-2.5 w-2.5" /> variant of {SHORT_BY_ID[m.parent!]}
            </span>
          )}
          {m.regimeLabel && <span className="text-muted-foreground">{m.regimeLabel}</span>}
        </div>
      )}
      <div className="p-4 grid grid-cols-3 gap-3">
        <div className="col-span-2 grid grid-cols-2 gap-2">
          <MetricCard label="T1" value={m.t1Us > 9000 ? "∞" : m.t1Us.toFixed(m.t1Us < 10 ? 1 : 0)} unit="µs" tone="good" />
          <MetricCard label="T2" value={m.t2Us > 9000 ? "∞" : m.t2Us.toFixed(m.t2Us < 10 ? 1 : 0)} unit="µs" tone="good" />
          <MetricCard label="1Q fidelity" value={m.gate1QFidelity.toFixed(2)} unit="%" tone="good" />
          <MetricCard label="2Q fidelity" value={m.gate2QFidelity.toFixed(2)} unit="%" tone={m.gate2QFidelity > 99 ? "good" : "warn"} />
          <MetricCard label="Readout err." value={m.readoutError.toFixed(2)} unit="%" tone="warn" />
          <MetricCard label="Crosstalk" value={m.crosstalk.toFixed(2)} tone={m.crosstalk > 0.25 ? "warn" : "good"} />
          <MetricCard label="Fab yield" value={m.yield} unit="%" tone={m.yield > 65 ? "good" : "warn"} />
          <MetricCard label="Cryo complexity" value={m.cryoComplexity.toFixed(2)} tone={m.cryoComplexity > 0.5 ? "warn" : "good"} hint={`${m.tempMK >= 1000 ? `${(m.tempMK / 1000).toFixed(0)} K` : `${m.tempMK} mK`}`} />
        </div>
        <div className="col-span-1">
          <div className="rounded-md border border-border/60 bg-surface-2/40 h-full p-2">
            <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Profile</div>
            <ResponsiveContainer width="100%" height={150}>
              <RadarChart data={[
                { k: "Coherence", v: Math.min(100, m.t1Us > 9000 ? 100 : m.t1Us / 2) },
                { k: "Gate", v: Math.max(0, (m.gate2QFidelity - 90) * 9) },
                { k: "Readout", v: Math.max(0, 100 - m.readoutError * 12) },
                { k: "Crosstalk", v: 100 - m.crosstalk * 150 },
                { k: "Yield", v: m.yield },
                { k: "Cryo", v: 100 - m.cryoComplexity * 100 },
              ]}>
                <PolarGrid stroke="oklch(0.32 0.03 255 / 0.5)" />
                <PolarAngleAxis dataKey="k" tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                <Radar dataKey="v" stroke={active ? "oklch(0.7 0.21 295)" : "oklch(0.82 0.16 200)"} fill={active ? "oklch(0.7 0.21 295)" : "oklch(0.82 0.16 200)"} fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 px-4 py-2.5 flex flex-wrap items-center gap-1.5 mono text-[10px]">
        {m.connectivity && <span className="rounded border border-border/60 bg-surface-2/50 px-1.5 py-0.5 text-muted-foreground">{m.connectivity}</span>}
        {m.native2qGate && <span className="rounded border border-cyan/30 bg-cyan/10 px-1.5 py-0.5 text-cyan">2Q: {m.native2qGate}</span>}
        <span className={cn("rounded border px-1.5 py-0.5", m.cliffordsNative === false ? "border-amber/30 bg-amber/10 text-amber" : "border-border/60 bg-surface-2/50 text-muted-foreground")}>
          Clifford-native: {m.cliffordsNative === false ? "no" : "yes"}
        </span>
        <span className="rounded border border-violet/30 bg-violet/10 px-1.5 py-0.5 text-violet">η={m.biasEta}{m.biasAxis ? ` (${m.biasAxis})` : ""}</span>
      </div>
      <div className="border-t border-border/60 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {m.cryoComplexity > 0.5 ? <Snowflake className="h-3.5 w-3.5 text-neon-blue" /> : <Atom className="h-3.5 w-3.5 text-cyan" />}
          <span className="line-clamp-1">{m.notes}</span>
        </div>
        <button
          onClick={onSelect}
          className={cn(
            "inline-flex items-center gap-1.5 rounded border px-2 py-1 mono text-[10px] uppercase tracking-[0.18em] transition shrink-0",
            active ? "border-cyan/50 bg-cyan/20 text-cyan" : "border-cyan/30 bg-cyan/10 text-cyan hover:bg-cyan/20",
          )}
        >
          {active ? <Check className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
          {active ? "Active" : "Select profile"}
        </button>
      </div>
    </Panel>
  );
}
