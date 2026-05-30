import { useState } from "react";
import { Activity, Cpu, Layers, Play, GitCompare, FileDown, ChevronDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const WORKLOADS = ["QAOA · MaxCut-64", "VQE · H₂O", "QFT · 32q", "Random · 20L", "Surface Syndrome"];
const PROFILES = ["SC-Transmon · 15 mK", "Si-Spin · 100 mK", "Photonic · 300 K", "Rydberg · µK"];

export function StatusBar() {
  const [workload, setWorkload] = useState(WORKLOADS[0]);
  const [profile, setProfile] = useState(PROFILES[0]);
  const [status, setStatus] = useState<"idle" | "running" | "converged">("converged");

  const run = () => {
    setStatus("running");
    toast.info("Optimization started", { description: "Genetic + RL refinement · seed 0x9F2C1A" });
    setTimeout(() => {
      setStatus("converged");
      toast.success("Converged", { description: "−28% SWAPs · +12% fidelity" });
    }, 1800);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border/60 bg-surface-1/60 backdrop-blur px-4 py-2.5 mono text-xs">
      <Selector icon={<Layers className="h-3.5 w-3.5 text-cyan" />} label="WORKLOAD" value={workload} options={WORKLOADS} onChange={setWorkload} />
      <Divider />
      <Stat icon={<Cpu className="h-3.5 w-3.5 text-violet" />} label="QUBIT BUDGET" value="127" />
      <Divider />
      <Selector icon={<Zap className="h-3.5 w-3.5 text-neon-blue" />} label="BACKEND" value={profile} options={PROFILES} onChange={setProfile} />
      <Divider />
      <StatusPill status={status} />
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" variant="outline" className="h-8 gap-1.5 border-border/70 mono text-[11px]" onClick={() => toast("Baseline comparison opened")}>
          <GitCompare className="h-3.5 w-3.5" /> Compare Baselines
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 border-border/70 mono text-[11px]" onClick={() => toast.success("Report exported", { description: "q-architect-run-0427.pdf" })}>
          <FileDown className="h-3.5 w-3.5" /> Export Report
        </Button>
        <Button size="sm" className="h-8 gap-1.5 bg-cyan text-primary-foreground hover:bg-cyan/90 mono text-[11px] font-semibold" onClick={run}>
          <Play className="h-3.5 w-3.5" /> Run Optimization
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

function Selector({ icon, label, value, options, onChange }: { icon: React.ReactNode; label: string; value: string; options: string[]; onChange: (v: string) => void }) {
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
          {options.map((o) => <option key={o} value={o} className="bg-surface-2">{o}</option>)}
        </select>
        <ChevronDown className="absolute right-0 h-3 w-3 text-muted-foreground pointer-events-none" />
      </span>
    </label>
  );
}

function Divider() {
  return <span className="h-4 w-px bg-border/70" />;
}

function StatusPill({ status }: { status: "idle" | "running" | "converged" }) {
  const map = {
    idle: { dot: "bg-muted-foreground", text: "IDLE", color: "text-muted-foreground" },
    running: { dot: "bg-amber animate-pulse", text: "RUNNING", color: "text-amber" },
    converged: { dot: "bg-neon-green", text: "CONVERGED", color: "text-neon-green" },
  } as const;
  const m = map[status];
  return (
    <div className="flex items-center gap-2">
      <Activity className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground tracking-[0.14em]">STATUS</span>
      <span className={`inline-flex items-center gap-1.5 ${m.color}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
        {m.text}
      </span>
    </div>
  );
}