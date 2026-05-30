"""
QEC code recommender.

Given a candidate material's noise profile — bias eta and 2-qubit gate error
rate — return which quantum error correction code is the best near-term fit.
Used in Stage 1 of the roadmap to map a candidate material onto the code
family that can actually correct its dominant errors.

Inputs
------
material : dict with at least:
    bias_eta    : float — noise bias (Z error / X error ratio)
    p_gate_2q   : float — physical two-qubit gate error rate

Decision boundaries (current heuristic — refine as new threshold data lands):
    p_2q > 0.015                    → above threshold; no 2D code helps
    eta >= 5                        → highly biased; XZZX surface code wins
    eta <  3 and p_2q < 0.003       → low bias + very low error; color code viable
    otherwise                       → rotated surface code (the safe default)
"""


def recommend_code(material: dict) -> str:
    eta = material["bias_eta"]
    p_2q = material["p_gate_2q"]

    # Above-threshold materials: nothing helps
    if p_2q > 0.015:
        return "NONE — material below threshold for any 2D code"

    # Highly biased → XZZX wins big
    if eta >= 5:
        return "XZZX surface code"

    # Low bias + very low error rate → color code becomes viable
    if eta < 3 and p_2q < 0.003:
        return "Color code (for cheap Clifford gates)"

    # Default: vanilla surface code
    return "Surface code (rotated layout)"


if __name__ == "__main__":
    # Sanity examples covering each branch.
    examples = [
        {"name": "Noisy candidate A",        "bias_eta": 1.2, "p_gate_2q": 0.020},
        {"name": "Biased candidate B",       "bias_eta": 8.0, "p_gate_2q": 0.008},
        {"name": "Clean isotropic C",        "bias_eta": 2.0, "p_gate_2q": 0.001},
        {"name": "Workhorse candidate D",    "bias_eta": 2.0, "p_gate_2q": 0.010},
    ]
    for m in examples:
        print(f"{m['name']:<24} (eta={m['bias_eta']}, p_2q={m['p_gate_2q']})")
        print(f"  → {recommend_code(m)}\n")
