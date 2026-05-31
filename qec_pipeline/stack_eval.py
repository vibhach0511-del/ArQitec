"""Shared combinatorial material-stack enumeration (mirrors materials-search.ts)."""

from __future__ import annotations

import json
import math
import os
import re
from dataclasses import asdict, dataclass

ROOT = os.path.join(os.path.dirname(__file__), "..")
MATERIALS_JSON = os.path.join(os.path.dirname(__file__), "outputs", "materials_project.json")
MATERIALS_TS = os.path.join(ROOT, "src", "lib", "qa", "materials-data.ts")

P_TH = 0.01
A = 0.1
DEFAULT_TARGET_PL = 1e-6


@dataclass
class StackRecord:
    stack_id: str
    electrode_id: str
    substrate_id: str
    junction_id: str
    superinductor_id: str
    effective_p2q: float
    bias_eta: float
    relevance: float
    code: str
    distance: float | None
    per_logical: int | None
    feasible: bool
    eval_wall_s: float | None = None


def _load_materials() -> list[dict]:
    if os.path.exists(MATERIALS_JSON):
        with open(MATERIALS_JSON) as f:
            data = json.load(f)
        if isinstance(data, list):
            return data
        return data.get("materials", data.get("records", []))
    # Fallback: parse TS export (minimal JSON-ish extraction)
    raise FileNotFoundError(
        f"No materials JSON at {MATERIALS_JSON}. Run: python -m qec_pipeline.materials_project"
    )


def role_buckets(materials: list[dict]) -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    electrodes = [m for m in materials if re.search(r"electrode", m.get("role", ""), re.I)]
    substrates = [m for m in materials if re.search(r"substrate", m.get("role", ""), re.I)]
    junctions = [m for m in materials if re.search(r"junction|barrier", m.get("role", ""), re.I)]
    superinductors = [m for m in materials if re.search(r"superinductor", m.get("role", ""), re.I)]
    return electrodes, substrates, junctions, superinductors


def mp_relevance(m: dict) -> float:
    role = m.get("role", "")
    wants_metal = bool(re.search(r"electrode|superinductor|interconnect", role, re.I))
    wants_dielectric = bool(re.search(r"substrate|dielectric|barrier|oxide", role, re.I))
    is_metal = m.get("isMetal") if "isMetal" in m else m.get("is_metal")
    role_fit = 60.0
    if is_metal is not None:
        if wants_metal:
            role_fit = 100.0 if is_metal else 30.0
        elif wants_dielectric:
            role_fit = 35.0 if is_metal else 100.0
    e_hull = m.get("eAboveHull") if m.get("eAboveHull") is not None else m.get("e_above_hull")
    stability = max(0.0, min(100.0, 100.0 - (e_hull or 0.1) * 250.0))
    ordering = m.get("ordering")
    mag = m.get("totalMagnetization") if m.get("totalMagnetization") is not None else m.get("total_magnetization")
    magnetic = (ordering and ordering != "NM") or abs(mag or 0) > 0.1
    mag_ok = 10.0 if magnetic else 100.0
    theoretical = m.get("theoretical")
    crystal = m.get("crystalSystem") or m.get("crystal_system")
    cryst = max(0.0, min(100.0, (70.0 if theoretical is False else 50.0) + (20.0 if crystal and crystal != "Triclinic" else 0.0)))
    score = 0.35 * role_fit + 0.3 * stability + 0.25 * mag_ok + 0.1 * cryst
    return round(max(0.0, min(100.0, score)) * 10) / 10


def recommend_code(p2q: float, bias_eta: float) -> str:
    if p2q > 0.015:
        return "NONE — above 2D-code threshold"
    if bias_eta >= 5:
        return "XZZX surface code"
    if bias_eta < 3 and p2q < 0.003:
        return "Color code"
    return "Surface code (rotated)"


def _next_odd_at_least_3(x: float) -> int:
    d = max(3, math.ceil(x))
    if d % 2 == 0:
        d += 1
    return d


def required_distance(p_phys: float, p_l: float) -> float | None:
    if p_phys >= P_TH or p_phys <= 0:
        return None
    if p_l >= A:
        return 3.0
    d = (2 * math.log(p_l / A)) / math.log(p_phys / P_TH) - 1
    return max(3.0, d)


def physical_per_logical(d: float) -> int:
    di = _next_odd_at_least_3(d)
    return 2 * di * di - 1


def _p_gate(m: dict) -> float:
    return float(m.get("pGate2q") or m.get("p_gate_2q") or 0.01)


def _bias(m: dict) -> float:
    return float(m.get("biasEta") or m.get("bias_eta") or 1.5)


def evaluate_stack(e: dict, s: dict, j: dict, si: dict, target_pl: float = DEFAULT_TARGET_PL) -> StackRecord:
    effective_p2q = 0.6 * _p_gate(e) + 0.2 * _p_gate(j) + 0.2 * _p_gate(s)
    bias_eta = max(_bias(e), _bias(si))
    code = recommend_code(effective_p2q, bias_eta)
    d = required_distance(effective_p2q, target_pl)
    feasible = d is not None and not code.startswith("NONE")
    if d is not None and ("XZZX" in code or "Color" in code):
        d = max(3.0, d / math.sqrt(max(1.0, bias_eta)))
    relevance = round((mp_relevance(e) + mp_relevance(s) + mp_relevance(j) + mp_relevance(si)) / 4 * 10) / 10
    stack_id = f"{e['id']}|{s['id']}|{j['id']}|{si['id']}"
    return StackRecord(
        stack_id=stack_id,
        electrode_id=e["id"],
        substrate_id=s["id"],
        junction_id=j["id"],
        superinductor_id=si["id"],
        effective_p2q=round(effective_p2q, 5),
        bias_eta=bias_eta,
        relevance=relevance,
        code=code,
        distance=round(d, 3) if d is not None else None,
        per_logical=physical_per_logical(d) if d is not None else None,
        feasible=feasible,
    )


def _better(a: StackRecord, b: StackRecord) -> bool:
    if a.feasible != b.feasible:
        return a.feasible
    if abs(a.relevance - b.relevance) > 0.5:
        return a.relevance > b.relevance
    return a.effective_p2q < b.effective_p2q


def enumerate_stacks(target_pl: float = DEFAULT_TARGET_PL) -> list[StackRecord]:
    materials = _load_materials()
    e, s, j, si = role_buckets(materials)
    stacks: list[StackRecord] = []
    for electrode in e:
        for substrate in s:
            for junction in j:
                for superinductor in si:
                    stacks.append(evaluate_stack(electrode, substrate, junction, superinductor, target_pl))
    return stacks


def best_stack(stacks: list[StackRecord]) -> StackRecord | None:
    best: StackRecord | None = None
    for st in stacks:
        if best is None or _better(st, best):
            best = st
    return best


def grover_iters(n: int) -> int:
    return math.ceil((math.pi / 4) * math.sqrt(max(1, n)))


def stack_to_dict(st: StackRecord) -> dict:
    return asdict(st)
