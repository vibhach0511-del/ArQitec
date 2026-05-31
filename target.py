"""
Performance Target Catalog (simplified).

The key metric, per physicist feedback: physical error rate must be
below the surface code threshold (~1.2% or 0.012) for QEC to help at all.

Each target specifies:
  - Required physical error rate (must be below for code to work)
  - Required logical error rate (what the user needs after QEC)
  - Approximate physical qubit budget
"""

from dataclasses import dataclass
from enum import Enum


class Target(str, Enum):
    NISQ_DEMO = "nisq_demo"
    LOGICAL_MEMORY = "logical_memory"
    SMALL_FT_CIRCUIT = "small_ft_circuit"
    SHOR_RSA = "shor_rsa"
    CHEMISTRY_FEMOCO = "chemistry_femoco"
    CUSTOM = "custom"


@dataclass
class TargetSpec:
    name: str
    description: str
    max_physical_error_rate: float    # must be below this for the code to work
    target_logical_error_rate: float  # what user needs after QEC
    max_physical_qubits: int


TARGETS = {
    Target.NISQ_DEMO: TargetSpec(
        name="NISQ Demo (no QEC)",
        description="Small circuits, no error correction needed.",
        max_physical_error_rate=0.012,    # surface code threshold (physicist's number)
        target_logical_error_rate=1e-2,
        max_physical_qubits=100,
    ),
    Target.LOGICAL_MEMORY: TargetSpec(
        name="Single Logical Qubit Memory",
        description="One logical qubit lives longer than its physical qubits.",
        max_physical_error_rate=0.005,    # need comfortably below threshold
        target_logical_error_rate=1e-4,
        max_physical_qubits=200,
    ),
    Target.SMALL_FT_CIRCUIT: TargetSpec(
        name="Small Fault-Tolerant Circuit",
        description="~100 logical operations, useful FT demo.",
        max_physical_error_rate=0.003,
        target_logical_error_rate=1e-6,
        max_physical_qubits=5_000,
    ),
    Target.SHOR_RSA: TargetSpec(
        name="Shor's Algorithm — RSA 2048",
        description="Factor RSA-2048. The big cryptography target.",
        max_physical_error_rate=0.001,
        target_logical_error_rate=1e-10,
        max_physical_qubits=1_000_000,
    ),
    Target.CHEMISTRY_FEMOCO: TargetSpec(
        name="Chemistry — FeMoco",
        description="Simulate nitrogenase active site.",
        max_physical_error_rate=0.0005,
        target_logical_error_rate=1e-12,
        max_physical_qubits=4_000_000,
    ),
    Target.CUSTOM: TargetSpec(
        name="Custom",
        description="User-specified target.",
        max_physical_error_rate=0.012,
        target_logical_error_rate=1e-6,
        max_physical_qubits=10_000,
    ),
}


def get(target: Target) -> TargetSpec:
    return TARGETS[target]


if __name__ == "__main__":
    print(f"{'Target':<35} {'Max p_err':<12} {'Logical err':<14} {'Qubits':<12}")
    print("-" * 75)
    for spec in TARGETS.values():
        print(f"{spec.name:<35} {spec.max_physical_error_rate:<12} "
              f"{spec.target_logical_error_rate:<14.0e} {spec.max_physical_qubits:<12,}")
