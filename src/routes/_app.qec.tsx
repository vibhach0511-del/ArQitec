import { createFileRoute } from "@tanstack/react-router";
import { QEC_CODES } from "@/data/mock";
import { Panel, SectionHeader, MetricRow, DeltaPill } from "@/components/qa/primitives";
import { ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/qec")({
  head: () => ({ meta: [{ title: "Error Correction Advisor — Q-Architect" }, { name: "description", content: "Compare surface, heavy-hex, color, and repetition codes for the current chip profile." }] }),
  component: QecPage,
});

function QecPage() {
  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Error Correction Advisor"
        title="Code selection · current profile"
        description="Physical-qubit cost, logical error, and compatibility scored against the SC-Transmon profile and AI-optimized topology."
      />

      <div className="mb-5 rounded-lg border border-violet/30 bg-gradient-to-r from-violet/10 via-transparent to-cyan/10 px-5 py-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-violet/20 border border-violet/40">
          <Sparkles className="h-4 w-4 text-violet" />
        </div>
        <div className="flex-1">
          <div className="mono text-[10px] uppercase tracking-[0.2em] text-violet">Agent recommendation</div>
          <div className="mt-0.5 text-sm text-foreground">
            <span className="font-semibold">Heavy-Hex Code (d=5)</span> — best balance of compatibility (96) and physical-qubit cost (74 phys/logical) under the current transmon profile.
          </div>
        </div>
        <DeltaPill value="selected" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {QEC_CODES.map(c => (
          <Panel key={c.id} title={c.family} subtitle={c.name}
            action={c.recommended ? <DeltaPill value="RECOMMENDED" /> : <span className="mono text-[10px] text-muted-foreground">d = {c.distance}</span>}>
            <div className="p-4 grid grid-cols-3 gap-3">
              <div className="rounded-md border border-border/60 bg-surface-2/40 p-3 col-span-1 flex flex-col items-center justify-center">
                <ShieldCheck className={`h-7 w-7 ${c.recommended ? "text-violet" : "text-cyan"}`} />
                <div className="mt-2 mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">code distance</div>
                <div className="mono text-3xl font-semibold text-foreground">d={c.distance}</div>
              </div>
              <div className="col-span-2">
                <MetricRow label="Physical qubits / logical" value={c.physicalPerLogical} bar={Math.min(100, c.physicalPerLogical)} />
                <MetricRow label="Logical error estimate" value={c.logicalError.toExponential(1)} bar={Math.max(2, 100 - Math.log10(1 / c.logicalError) * 12)} tone="amber" />
                <MetricRow label="Syndrome overhead" value={`${c.syndromeOverhead}%`} bar={c.syndromeOverhead} tone="violet" />
                <MetricRow label="Compatibility" value={c.compatibility} bar={c.compatibility} tone="green" />
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
