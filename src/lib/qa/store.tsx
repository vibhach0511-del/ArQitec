// Q-Architect — client state store.
// Holds the active architecture selection and exposes derived results, the
// simulated optimization run, and report export. Wrapped around the /_app layout
// so every workspace route shares one configuration.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  bestTopologyFor,
  buildResult,
  exportJSON,
  exportMarkdown,
  OPTIMIZATION_STEPS,
} from "./engine";
import { getMaterial, getTopology, getWorkload } from "./data";
import type {
  ArchitectureConfig,
  MaterialId,
  OptimizationResult,
  QECId,
  TopologyId,
  WorkloadId,
} from "./types";

type RunStatus = "idle" | "running" | "converged";

interface QAContextValue {
  config: ArchitectureConfig;
  material: ReturnType<typeof getMaterial>;
  topology: ReturnType<typeof getTopology>;
  workload: ReturnType<typeof getWorkload>;
  /** Live result for the current selection (recomputed instantly). */
  result: OptimizationResult;
  /** Snapshot committed by the last completed run (drives Results/Agent). */
  committed: OptimizationResult;
  status: RunStatus;
  activeStep: number;
  progress: number;
  hasRun: boolean;
  setMaterial: (id: MaterialId) => void;
  setTopology: (id: TopologyId) => void;
  setWorkload: (id: WorkloadId) => void;
  setQEC: (id: QECId | undefined) => void;
  runOptimization: () => void;
  exportReport: (format: "json" | "markdown") => void;
}

const QAContext = createContext<QAContextValue | null>(null);

const DEFAULT_CONFIG: ArchitectureConfig = {
  materialId: "transmon",
  topologyId: "ai-opt",
  workloadId: "qaoa",
  qecId: undefined,
};

export function QAProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ArchitectureConfig>(DEFAULT_CONFIG);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [activeStep, setActiveStep] = useState(-1);
  const [hasRun, setHasRun] = useState(false);
  const [committed, setCommitted] = useState<OptimizationResult>(() =>
    buildResult(DEFAULT_CONFIG),
  );
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const result = useMemo(() => buildResult(config), [config]);

  const material = getMaterial(config.materialId);
  const topology = getTopology(config.topologyId);
  const workload = getWorkload(config.workloadId);

  const patch = useCallback((p: Partial<ArchitectureConfig>) => {
    setConfig((c) => ({ ...c, ...p }));
  }, []);

  const setMaterial = useCallback((id: MaterialId) => patch({ materialId: id }), [patch]);
  const setTopology = useCallback((id: TopologyId) => patch({ topologyId: id }), [patch]);
  const setWorkload = useCallback((id: WorkloadId) => patch({ workloadId: id }), [patch]);
  const setQEC = useCallback((id: QECId | undefined) => patch({ qecId: id }), [patch]);

  const runOptimization = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStatus("running");
    setActiveStep(0);
    toast.info("Optimization started", {
      description: `${OPTIMIZATION_STEPS.length} stages · genetic + RL refinement`,
    });

    const stepMs = 460;
    OPTIMIZATION_STEPS.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => setActiveStep(i), i * stepMs),
      );
    });

    // At the "select" stage, adopt the highest-scoring candidate topology.
    timers.current.push(
      setTimeout(() => {
        const best = bestTopologyFor({
          materialId: config.materialId,
          workloadId: config.workloadId,
          qecId: config.qecId,
        });
        setConfig((c) => ({ ...c, topologyId: best.id }));
      }, (OPTIMIZATION_STEPS.length - 1) * stepMs),
    );

    timers.current.push(
      setTimeout(() => {
        const best = bestTopologyFor({
          materialId: config.materialId,
          workloadId: config.workloadId,
          qecId: config.qecId,
        });
        const finalConfig: ArchitectureConfig = { ...config, topologyId: best.id };
        const snapshot = buildResult(finalConfig, new Date().toISOString());
        setCommitted(snapshot);
        setStatus("converged");
        setActiveStep(OPTIMIZATION_STEPS.length);
        setHasRun(true);
        toast.success("Architecture converged", {
          description: `${best.name} · score ${snapshot.score.architectureScore}/100`,
        });
      }, OPTIMIZATION_STEPS.length * stepMs),
    );
  }, [config]);

  const exportReport = useCallback(
    (format: "json" | "markdown") => {
      const snapshot = buildResult(config, new Date().toISOString());
      const content = format === "json" ? exportJSON(snapshot) : exportMarkdown(snapshot);
      const ext = format === "json" ? "json" : "md";
      const filename = `q-architect-${config.topologyId}-${config.workloadId}.${ext}`;
      if (typeof document !== "undefined") {
        const blob = new Blob([content], {
          type: format === "json" ? "application/json" : "text/markdown",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      toast.success("Report exported", { description: filename });
    },
    [config],
  );

  const progress =
    status === "running"
      ? Math.min(1, (activeStep + 1) / OPTIMIZATION_STEPS.length)
      : status === "converged"
        ? 1
        : 0;

  const value: QAContextValue = {
    config,
    material,
    topology,
    workload,
    result,
    committed,
    status,
    activeStep,
    progress,
    hasRun,
    setMaterial,
    setTopology,
    setWorkload,
    setQEC,
    runOptimization,
    exportReport,
  };

  return <QAContext.Provider value={value}>{children}</QAContext.Provider>;
}

export function useQA(): QAContextValue {
  const ctx = useContext(QAContext);
  if (!ctx) throw new Error("useQA must be used within <QAProvider>");
  return ctx;
}
