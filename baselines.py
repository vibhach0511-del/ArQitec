"""Drop 4 Section 3 baselines (T1-T4) + Drop 3 PennyLane VQC hello-world.

Run inside the `qai` env:
    conda activate qai && python baselines.py
"""
import numpy as np


def track1_lstm():
    print("=== Track 1 - LSTM LOB Baseline ===")
    import torch
    import torch.nn as nn

    np.random.seed(42)
    X = np.random.randn(1000, 10, 5).astype("float32")
    y = (np.random.randn(1000) > 0).astype("float32")

    class LSTM(nn.Module):
        def __init__(self):
            super().__init__()
            self.lstm = nn.LSTM(5, 32, batch_first=True)
            self.fc = nn.Linear(32, 1)

        def forward(self, x):
            out, _ = self.lstm(x)
            return torch.sigmoid(self.fc(out[:, -1, :]))

    model = LSTM()
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_fn = nn.BCELoss()
    Xt = torch.tensor(X)
    yt = torch.tensor(y).unsqueeze(1)
    pred = None
    for _ in range(20):
        pred = model(Xt)
        loss = loss_fn(pred, yt)
        opt.zero_grad()
        loss.backward()
        opt.step()
    acc = ((pred > 0.5).float() == yt).float().mean().item()
    print(f"T1 Baseline accuracy: {acc:.1%}")


def track2_cvxpy():
    print("\n=== Track 2 - CVXPY Markowitz Baseline ===")
    import cvxpy as cp

    np.random.seed(42)
    n = 20
    mu = np.random.randn(n) * 0.001 + 0.0005
    A = np.random.randn(n, n)
    Sigma = A.T @ A / n + np.eye(n) * 0.001
    w = cp.Variable(n)
    prob = cp.Problem(
        cp.Maximize(mu @ w - 0.5 * cp.quad_form(w, Sigma)),
        [cp.sum(w) == 1, w >= 0],
    )
    prob.solve()
    sharpe = (mu @ w.value) / np.sqrt(w.value @ Sigma @ w.value) * np.sqrt(252)
    print(f"T2 Baseline Sharpe: {sharpe:.3f}")


def track3_var_cvar():
    print("\n=== Track 3 - VaR / CVaR Baseline ===")
    np.random.seed(42)
    returns = np.random.randn(252) * 0.01
    VaR = np.percentile(returns, 5)
    mc = np.random.randn(100000) * returns.std() + returns.mean()
    CVaR = mc[mc <= np.percentile(mc, 5)].mean()
    print(f"T3 Baseline VaR(95%): {VaR:.4f}  CVaR(95%): {CVaR:.4f}")


def pennylane_vqc():
    print("\n=== Drop 3 - PennyLane VQC hello-world ===")
    import pennylane as qml
    from pennylane import numpy as pnp

    dev = qml.device("default.qubit", wires=2)

    @qml.qnode(dev)
    def circuit(x, w):
        qml.AngleEmbedding(x, wires=[0, 1])
        qml.BasicEntanglerLayers(w, wires=[0, 1])
        return qml.expval(qml.PauliZ(0))

    x = pnp.array([0.5, 0.1])
    w = pnp.random.random((1, 2), requires_grad=True)
    out = circuit(x, w)
    print(f"VQC expectation <Z0>: {float(out):.4f}")


def track4_chronos():
    print("\n=== Track 4 - Chronos Zero-Shot Baseline ===")
    try:
        import torch
        import yfinance as yf
        from chronos import BaseChronosPipeline

        df = yf.download("AAPL", period="2y", progress=False)["Close"].dropna()
        vals = df.values.astype("float32").reshape(-1)
        context = torch.tensor(vals[:-30]).unsqueeze(0)

        pipeline = BaseChronosPipeline.from_pretrained(
            "amazon/chronos-t5-small", device_map="cpu", torch_dtype=torch.float32
        )
        quantiles, mean = pipeline.predict_quantiles(
            context, prediction_length=30, quantile_levels=[0.5]
        )
        median = quantiles[0, :, 0].numpy()
        actual = vals[-30:]
        dir_acc = ((median[1:] > median[:-1]) == (actual[1:] > actual[:-1])).mean()
        print(f"Zero-shot directional accuracy: {dir_acc:.1%}  (baseline ~50-54%)")
    except Exception as e:  # noqa: BLE001
        print(f"Chronos baseline skipped ({type(e).__name__}: {e})")
        print("Likely no network / HF download blocked. Re-run when online.")


if __name__ == "__main__":
    track1_lstm()
    track2_cvxpy()
    track3_var_cvar()
    pennylane_vqc()
    track4_chronos()
