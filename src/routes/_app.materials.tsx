import { createFileRoute } from "@tanstack/react-router";
import { MATERIALS } from "@/data/mock";
import { Panel, SectionHeader, MetricCard } from "@/components/qa/primitives";
import { Atom, Snowflake, Sparkles } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/_app/materials")({
  head: () => ({ meta: [{ title: "Materials & Process — Q-Architect" }, { name: "description", content: "Qubit material and process profiles: transmon, Si spin, photonic, neutral atom." }] }),
  component: MaterialsPage,
});

function MaterialsPage() {
  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Materials & Process"
        title="Process profile library"
        description="Four qubit modalities co-designed against fab realities. All metrics are mock, calibrated to literature ranges."
      />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-2">
        {MATERIALS.map((m) => (
          <Panel key={m.id} title={m.short} subtitle={m.name} action={<span className="mono text-[10px] uppercase tracking-[0.18em] text-cyan">{m.vendor}</span>}>
            <div className="p-4 grid grid-cols-3 gap-3">
              <div className="col-span-2 grid grid-cols-2 gap-2">
                <MetricCard label="T1" value={m.t1_us > 9000 ? "∞" : m.t1_us.toFixed(0)} unit="µs" tone="good" />
                <MetricCard label="T2" value={m.t2_us > 9000 ? "∞" : m.t2_us.toFixed(0)} unit="µs" tone="good" />
                <MetricCard label="1Q fidelity" value={m.gate_1q_fidelity.toFixed(2)} unit="%" tone="good" />
                <MetricCard label="2Q fidelity" value={m.gate_2q_fidelity.toFixed(2)} unit="%" tone={m.gate_2q_fidelity > 99 ? "good" : "warn"} />
                <MetricCard label="Readout err." value={m.readout_error.toFixed(2)} unit="%" tone="warn" />
                <MetricCard label="Crosstalk" value={m.crosstalk.toFixed(2)} tone={m.crosstalk > 0.25 ? "warn" : "good"} />
                <MetricCard label="Fab yield" value={m.yield} unit="%" tone={m.yield > 65 ? "good" : "warn"} />
                <MetricCard label="Cryo complexity" value={m.cryo.toFixed(2)} tone={m.cryo > 0.5 ? "warn" : "good"} hint={`${m.temp_mK >= 1000 ? `${(m.temp_mK / 1000).toFixed(0)} K` : `${m.temp_mK} mK`}`} />
              </div>
              <div className="col-span-1">
                <div className="rounded-md border border-border/60 bg-surface-2/40 h-full p-2">
                  <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Profile</div>
                  <ResponsiveContainer width="100%" height={150}>
                    <RadarChart data={[
                      { k: "Coherence", v: Math.min(100, m.t1_us > 9000 ? 100 : m.t1_us / 14) },
                      { k: "Gate", v: (m.gate_2q_fidelity - 95) * 18 },
                      { k: "Readout", v: 100 - m.readout_error * 30 },
                      { k: "Crosstalk", v: 100 - m.crosstalk * 220 },
                      { k: "Yield", v: m.yield },
                      { k: "Cryo", v: 100 - m.cryo * 100 },
                    ]}>
                      <PolarGrid stroke="oklch(0.32 0.03 255 / 0.5)" />
                      <PolarAngleAxis dataKey="k" tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                      <Radar dataKey="v" stroke="oklch(0.82 0.16 200)" fill="oklch(0.82 0.16 200)" fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="border-t border-border/60 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {m.cryo > 0.5 ? <Snowflake className="h-3.5 w-3.5 text-neon-blue" /> : <Atom className="h-3.5 w-3.5 text-cyan" />}
                <span className="line-clamp-1">{m.notes}</span>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded border border-cyan/30 bg-cyan/10 px-2 py-1 mono text-[10px] uppercase tracking-[0.18em] text-cyan hover:bg-cyan/20 transition">
                <Sparkles className="h-3 w-3" /> Select profile
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
