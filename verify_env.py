"""Verify the qai environment matches the Drop 4 setup checklist.

Run inside the `qai` conda env:
    conda activate qai && python verify_env.py
"""
import importlib
import sys

CHECKS = [
    ("qiskit", "Quantum (Drop 4 step 2)"),
    ("qiskit_aer", "Quantum (Drop 4 step 2)"),
    ("qiskit_algorithms", "Quantum (Drop 4 step 2)"),
    ("qiskit_optimization", "Quantum (QAOA toy needs QuadraticProgram)"),
    ("pennylane", "Quantum (Drop 4 step 2)"),
    ("torch", "ML (Drop 4 step 3)"),
    ("transformers", "ML (Drop 4 step 3)"),
    ("huggingface_hub", "ML (Drop 4 step 3)"),
    ("datasets", "ML (Drop 4 step 3)"),
    ("peft", "ML (Drop 4 step 3)"),
    ("yfinance", "Finance (Drop 4 step 4)"),
    ("alpaca", "Finance (alpaca-py, Drop 4 step 4)"),
    ("polygon", "Finance (polygon-api-client, Drop 4 step 4)"),
    ("cvxpy", "Finance (Drop 4 step 4)"),
    ("pypfopt", "Finance (pyportfolioopt, Drop 4 step 4)"),
    ("backtrader", "Finance (Drop 4 step 4)"),
    ("langchain", "LLM/agent (Drop 4 step 5)"),
    ("langchain_openai", "LLM/agent (Drop 4 step 5)"),
    ("chromadb", "LLM/agent (Drop 4 step 5)"),
    ("chronos", "Foundation models (Drop 4 step 6)"),
    ("autogluon.timeseries", "Foundation models (Drop 4 step 6)"),
]


def main():
    print(f"Python: {sys.version.split()[0]}  (target 3.11.x)\n")
    ok, fail = 0, 0
    for mod, group in CHECKS:
        try:
            m = importlib.import_module(mod)
            ver = str(getattr(m, "__version__", "?"))
            print(f"  OK   {mod:<24} {ver:<12} {group}")
            ok += 1
        except Exception as e:  # noqa: BLE001
            print(f"  FAIL {mod:<24} {'-':<12} {group}  ({type(e).__name__}: {e})")
            fail += 1
    print(f"\n{ok} passed, {fail} failed of {len(CHECKS)} packages.")
    return 1 if fail else 0


if __name__ == "__main__":
    raise SystemExit(main())
