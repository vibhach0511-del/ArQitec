"""
Materials library — candidate qubit platforms / materials with their
characteristic noise profiles (bias eta and 2-qubit gate error rate).
Used as inputs to qec_recommender.recommend_code() to map each material
onto its best-fit near-term QEC code family.

Numbers below are **illustrative** representative values reflecting the
general state-of-the-art for each platform — they are not pulled from
specific published runs and should be replaced with real measurements
before any decision matters. Sources / measurement notes belong in the
`notes` field of each entry.
"""

from qec_recommender import recommend_code


MATERIALS = [
    {
        "name": "Superconducting transmon (IBM Heron-class)",
        "bias_eta": 1.5,
        "p_gate_2q": 0.005,
        "notes": "Workhorse platform. Nearly isotropic Pauli noise; gate fidelity continuing to improve year-over-year.",
    },
    {
        "name": "Trapped ion (Quantinuum H-class)",
        "bias_eta": 3.0,
        "p_gate_2q": 0.002,
        "notes": "All-to-all connectivity, slow but very high fidelity gates. Mild bias from collective dephasing.",
    },
    {
        "name": "Neutral atom (QuEra / Pasqal-class)",
        "bias_eta": 1.2,
        "p_gate_2q": 0.005,
        "notes": "Rydberg-mediated two-qubit gates. Reconfigurable arrays open architectural design space.",
    },
    {
        "name": "Silicon spin qubit (Diraq / Intel-class)",
        "bias_eta": 2.0,
        "p_gate_2q": 0.008,
        "notes": "CMOS-foundry compatible. Modest bias from nuclear-spin / magnetic noise; gate errors trending down quickly.",
    },
    {
        "name": "Fluxonium (Atlantic Quantum-class)",
        "bias_eta": 6.0,
        "p_gate_2q": 0.004,
        "notes": "Strong phase / dephasing dominance — bias-noise codes naturally fit this regime.",
    },
    {
        "name": "Cat qubit (dual-rail superconducting)",
        "bias_eta": 500.0,
        "p_gate_2q": 0.010,
        "notes": "Engineered biased-noise: bit flips exponentially suppressed by photon-number parity. Bias eta of 100–1000+ is the design point.",
    },
    {
        "name": "Bosonic GKP code",
        "bias_eta": 50.0,
        "p_gate_2q": 0.003,
        "notes": "Continuous-variable encoding with structured logical noise. Concatenation with a 2D code is the typical near-term plan.",
    },
    {
        "name": "Early-stage topological (Majorana)",
        "bias_eta": 100.0,
        "p_gate_2q": 0.015,
        "notes": "Strong-bias regime if it works at scale; physical error rates still uncertain. Use only as a placeholder until real benchmarks land.",
    },
    {
        "name": "Photonic dual-rail (PsiQuantum-class)",
        "bias_eta": 1.5,
        "p_gate_2q": 0.020,
        "notes": "Loss-dominated error model; numbers here parameterize an effective Pauli channel only. Above 2D-code threshold under this simplification.",
    },
    {
        "name": "Trapped-ion magic-state factory candidate (high-fidelity)",
        "bias_eta": 2.5,
        "p_gate_2q": 0.001,
        "notes": "Hypothetical low-error point that would unlock the color code branch of the recommender.",
    },
]


def by_name(query: str) -> list[dict]:
    """Case-insensitive substring lookup against material names."""
    q = query.lower()
    return [m for m in MATERIALS if q in m["name"].lower()]


def names() -> list[str]:
    return [m["name"] for m in MATERIALS]


if __name__ == "__main__":
    # Run the recommender over the whole library to demonstrate the end-to-end
    # flow: material → noise profile → recommended QEC code.
    print(f"{'MATERIAL':<52} {'BIAS η':>8} {'p_2q':>10}  RECOMMENDATION")
    print("-" * 110)
    for m in MATERIALS:
        rec = recommend_code(m)
        print(f"{m['name']:<52} {m['bias_eta']:>8.1f} {m['p_gate_2q']:>10.4f}  {rec}")
