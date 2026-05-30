import { Activity, Cpu, Layers, Play, GitCompare, FileDown, ChevronDown, Zap, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useQA } from "@/lib/qa/store";
import { MATERIAL_PROFILES, QUANTUM_WORKLOADS, QUBIT_BUDGET } from "@/lib/qa/data";
import { OPTIMIZATION_STEPS } from "@/lib/qa/engine";
import type { MaterialId, WorkloadId } from "@/lib/qa/types";

export function StatusBar() {
  const qa = useQA();
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border/60 bg-surface-1/60 backdrop-blur px-4 py-2.5 mono text-xs">
      <Selector
        icon={<Layers className="h-3.5 w-3.5 text-cyan" />}
        label="WORKLOAD"
        value={qa.config.workloadId}
        options={QUANTUM_WORKLOADS.map((w) => ({ id: w.id, label: w.name }))}
        onChange={(v) => qa.setWorkload(v as WorkloadId)}
      />
      <Divider />
      <Stat icon={<Cpu className="h-3.5 w-3.5 text-violet" />} label="QUBIT BUDGET" value={String(QUBIT_BUDGET)} />
      <Divider />
      <Selector
        icon={<Zap className="h-3.5 w-3.5 text-neon-blue" />}
        label="BACKEND"
        value={qa.config.materialId}
        options={MATERIAL_PROFILES.map((m) => ({ id: m.id, label: m.vendor }))}
        onChange={(v) => qa.setMaterial(v as MaterialId)}
      />
      <Divider />
      <StatusPill status={qa.status} step={qa.activeStep} />
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" variant="outline" className="h-8 gap-1.5 border-border/70 mono text-[11px]" onClick={() => navigate({ to: "/results" })}>
          <GitCompare className="h-3.5 w-3.5" /> Compare Baselines
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 border-border/70 mono text-[11px]" onClick={() => qa.exportReport("markdown")}>
          <FileDown className="h-3.5 w-3.5" /> Export Report
        </Button>
        <Button
          size="sm"
          className="h-8 gap-1.5 bg-cyan text-primary-foreground hover:bg-cyan/90 mono text-[11px] font-semibold disabled:opacity-60"
          onClick={qa.runOptimization}
          disabled={qa.status === "running"}
        >
          {qa.status === "running" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          {qa.status === "running" ? "Optimizing…" : "Run Optimization"}
        </Button>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-muted-foreground tracking-[0.14em]">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

function Selector({ icon, label, value, options, onChange }: { icon: React.ReactNode; label: string; value: string; options: { id: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      {icon}
      <span className="text-muted-foreground tracking-[0.14em]">{label}</span>
      <span className="relative inline-flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-transparent text-foreground font-medium pr-5 focus:outline-none cursor-pointer hover:text-cyan transition"
        >
          {options.map((o) => <option key={o.id} value={o.id} className="bg-surface-2">{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-0 h-3 w-3 text-muted-foreground pointer-events-none" />
      </span>
    </label>
  );
}

function Divider() {
  return <span className="h-4 w-px bg-border/70" />;
}

function StatusPill({ status, step }: { status: "idle" | "running" | "converged"; step: number }) {
  const stepLabel = step >= 0 && step < OPTIMIZATION_STEPS.length ? OPTIMIZATION_STEPS[step].label : "";
  const map = {
    idle: { dot: "bg-muted-foreground", text: "IDLE", color: "text-muted-foreground" },
    running: { dot: "bg-amber animate-pulse", text: stepLabel ? `RUNNING · ${stepLabel}` : "RUNNING", color: "text-amber" },
    converged: { dot: "bg-neon-green", text: "CONVERGED", color: "text-neon-green" },
  } as const;
  const m = map[status];
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground tracking-[0.14em] shrink-0">STATUS</span>
      <span className={`inline-flex items-center gap-1.5 truncate ${m.color}`}>
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${m.dot}`} />
        <span className="truncate">{m.text}</span>
      </span>
    </div>
  );
}
