import qldpc, numpy as np, json
results = []
CODES = [
    ("surface", lambda d: qldpc.codes.SurfaceCode(d)),
    ("toric",   lambda d: qldpc.codes.ToricCode(d*2, d*2)),
    ("steane",  lambda _: qldpc.codes.SteaneCode()),
    ("bacon_shor", lambda d: qldpc.codes.BaconShorCode(d, d)),
]
DISTANCES = [3, 5, 7]
for name, factory in CODES:
    for d in DISTANCES:
        try:
            code = factory(d)
            hx = np.array(code.matrix_x).astype(int)
            hz = np.array(code.matrix_z).astype(int)
            n, k, dist = code.get_code_params()
            mdx = int(hx.sum(axis=1).max())
            mdz = int(hz.sum(axis=1).max())
            rec = {"code_id": name, "distance": d, "n_qubits": int(n), "k_logicals": int(k), "code_distance": int(dist), "hx_shape": list(hx.shape), "hz_shape": list(hz.shape), "max_degree_hx": mdx, "max_degree_hz": mdz, "check_weight_hx": float(hx.sum(axis=1).mean()), "check_weight_hz": float(hz.sum(axis=1).mean()), "ancilla_fraction": round(hx.shape[0]/n, 3)}
            results.append(rec)
            print(f"OK: {name} d={d} | n={n} k={k} | max_deg={mdx}")
        except Exception as e:
            print(f"SKIP: {name} d={d} --- {e}")
with open("parity_matrices.json", "w") as f:
    json.dump(results, f, indent=2)
print(f"Saved {len(results)} records")