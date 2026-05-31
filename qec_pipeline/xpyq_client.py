"""XpyQ Cloud API client for per-stack materials search benchmarks.

Dashboard (sign-in): https://xpyq.vercel.app/functions
Backend API:         https://xpyq-lib-production.up.railway.app  (Bearer xpyq_live_* key)

OpenAPI: {API_BASE}/openapi.json
Run:     POST /api/v2/run  { code | function_name, wait: true, hardware: "auto" }
"""

from __future__ import annotations

import json
import os
import time

import requests

ROOT = os.path.join(os.path.dirname(__file__), "..")
CACHE_DIR = os.path.join(os.path.dirname(__file__), "outputs", "xpyq_stack_runs")

# Backend resolved from xpyq.vercel.app frontend bundles (not the Vercel HTML routes).
DEFAULT_API_BASE = "https://xpyq-lib-production.up.railway.app"
DEFAULT_UI_BASE = "https://xpyq.vercel.app/functions"


def read_key() -> str | None:
    if os.environ.get("XPYQ_API_KEY"):
        return os.environ["XPYQ_API_KEY"]
    env = os.path.join(ROOT, ".env")
    if os.path.exists(env):
        for line in open(env):
            if line.strip().startswith("XPYQ_API_KEY="):
                val = line.split("=", 1)[1].strip()
                return val or None
    return None


def read_email() -> str | None:
    if os.environ.get("XPYQ_EMAIL"):
        return os.environ["XPYQ_EMAIL"].strip()
    env = os.path.join(ROOT, ".env")
    if os.path.exists(env):
        for line in open(env):
            if line.strip().startswith("XPYQ_EMAIL="):
                val = line.split("=", 1)[1].strip()
                return val or None
    return None


def verify_login(email: str | None = None, key: str | None = None) -> dict:
    """Confirm allowlisted email + live API key (dashboard login + programmatic auth)."""
    email = email or read_email()
    key = key or read_key()
    base = api_base()
    out: dict = {"email": email, "allowed": None, "credits": None, "me": None}
    if email:
        try:
            r = requests.get(
                f"{base}/api/v2/auth/check_signin_allowed",
                params={"email": email},
                timeout=15,
            )
            r.raise_for_status()
            out["allowed"] = r.json().get("allowed")
        except Exception as exc:  # noqa: BLE001
            out["allow_error"] = str(exc)
    if key:
        try:
            r = requests.get(
                f"{base}/api/v2/auth/credits",
                headers=_headers(key),
                timeout=15,
            )
            r.raise_for_status()
            body = r.json()
            out["credits"] = body.get("balance")
        except Exception as exc:  # noqa: BLE001
            out["credits_error"] = str(exc)
        try:
            r = requests.get(f"{base}/api/v2/auth/me", headers=_headers(key), timeout=15)
            if r.status_code == 200:
                out["me"] = r.json()
        except Exception:  # noqa: BLE001
            pass
    return out


def api_base() -> str:
    return (
        os.environ.get("XPYQ_API_BASE", "").rstrip("/")
        or DEFAULT_API_BASE
    )


def ui_base() -> str:
    return os.environ.get("XPYQ_UI_BASE", DEFAULT_UI_BASE).rstrip("/")


def _headers(key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def _cache_path(stack_id: str) -> str:
    safe = stack_id.replace("|", "_").replace("/", "_")
    return os.path.join(CACHE_DIR, f"{safe}.json")


def stack_eval_code(stack: dict) -> str:
    """Minimal xpyq function body scoring one material stack (mirrors TS heuristic)."""
    return f"""# materials stack QEC eval — {stack['stack_id']}
effective_p2q = {stack['effective_p2q']}
bias_eta = {stack['bias_eta']}
relevance = {stack['relevance']}
code_name = {json.dumps(stack['code'])}
feasible = {json.dumps(stack['feasible'])}
fitness = relevance * (1.0 - effective_p2q) * (1.0 + 0.1 * bias_eta)
if not feasible:
    fitness *= 0.5
print(round(fitness, 4))
"""


def run_stack_on_xpyq(stack: dict, key: str, *, hardware: str = "auto") -> dict:
    """Submit inline code to POST /api/v2/run and return timing metadata."""
    base = api_base()
    code = stack_eval_code(stack)
    t0 = time.perf_counter()
    r = requests.post(
        f"{base}/api/v2/run",
        headers=_headers(key),
        json={"code": code, "wait": True, "hardware": hardware},
        timeout=300,
    )
    wall = time.perf_counter() - t0
    r.raise_for_status()
    body = r.json()
    summary = body.get("summary") or {}
    exec_ms = summary.get("execution_time_ms")
    wall_s = (exec_ms / 1000.0) if exec_ms is not None else wall
    return {
        "stack_id": stack["stack_id"],
        "wallclock_s": round(wall_s, 6),
        "source": "xpyq_api",
        "api": {
            "url": f"{base}/api/v2/run",
            "run_id": body.get("run_id") or summary.get("run_id"),
            "execution_time_ms": exec_ms,
            "credits": summary.get("credits"),
            "hardware": hardware,
            "ui_base": ui_base(),
            "success": summary.get("success"),
        },
    }


def evaluate_stack(stack: dict, key: str, base: str | None = None) -> dict:
    """Evaluate one stack via XpyQ API; cache results."""
    _ = base  # legacy param — api_base() is canonical
    stack_id = stack["stack_id"]
    cache = _cache_path(stack_id)
    if os.path.exists(cache):
        with open(cache) as f:
            cached = json.load(f)
        if cached.get("source") == "xpyq_api":
            return cached

    try:
        record = run_stack_on_xpyq(stack, key)
    except Exception as exc:  # noqa: BLE001
        record = {
            "stack_id": stack_id,
            "wallclock_s": 0.002,
            "source": "xpyq_error",
            "api": {"error": str(exc), "ui_base": ui_base()},
        }

    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(cache, "w") as f:
        json.dump(record, f, indent=2)
    return record


def run_all_stacks(
    stacks: list[dict],
    key: str | None = None,
    *,
    refresh: bool = False,
) -> tuple[list[dict], str]:
    key = key or read_key()
    if not key:
        raise SystemExit("No XPYQ_API_KEY in env or .env")

    base = api_base()
    if refresh and os.path.isdir(CACHE_DIR):
        for fn in os.listdir(CACHE_DIR):
            if fn.endswith(".json"):
                os.remove(os.path.join(CACHE_DIR, fn))

    print(f"  XpyQ API: {base} (UI: {ui_base()})")
    login = verify_login(key=key)
    if login.get("email"):
        allowed = login.get("allowed")
        credits = login.get("credits")
        print(f"  XpyQ login: {login['email']} (allowlisted={allowed}, credits={credits})")
    results: list[dict] = []
    for i, st in enumerate(stacks):
        rec = evaluate_stack(st, key, base)
        results.append(rec)
        if (i + 1) % 10 == 0:
            print(f"  XpyQ: {i + 1}/{len(stacks)} stacks")
        time.sleep(0.1)
    return results, base
