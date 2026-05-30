# Quantum AI Hackathon - Environment Setup

Environment prepared per Drop 1-4 prep docs. Miniconda was installed (none was present)
and a `qai` env created on Python 3.11.

## Activate

```bash
conda activate qai   # zsh was initialized; open a new terminal if needed
```

## Drop 4 - 10-Step Checklist Status

| # | Task | Status |
| - | ---- | ------ |
| 1 | conda env `qai`, Python 3.11 | DONE (3.11.15) |
| 2 | qiskit, qiskit-aer, qiskit-algorithms, pennylane (+qiskit-optimization) | DONE |
| 3 | torch, transformers, huggingface_hub, datasets, peft | DONE |
| 4 | yfinance, alpaca-py, polygon-api-client, cvxpy, pyportfolioopt, backtrader | DONE |
| 5 | langchain, langchain-openai, chromadb | DONE |
| 6 | chronos-forecasting, autogluon.timeseries | DONE |
| 7 | IBM Quantum API key | DONE - saved via QiskitRuntimeService (channel `ibm_quantum_platform`); verified 3 open backends |
| 8 | Alpaca paper trading keys | MANUAL - sign up at alpaca.markets |
| 9 | Polygon.io API key | MANUAL - sign up at polygon.io |
| 10 | Clone track[N] starter repo | NOT PUBLIC - `github.com/qai-hackathon/*` 404s; distributed via Slack |

## Verify & Run

```bash
python verify_env.py          # imports all 21 packages -> 21 passed
python quantum_quickstart.py  # Bell state (~50/50) + QAOA toy portfolio
python baselines.py           # Track 1-4 baselines + PennyLane VQC + Chronos
```

### Recorded baseline outputs (seed 42)

- T1 LSTM accuracy: 53.7%
- T2 CVXPY Sharpe: 0.033
- T3 VaR(95%): -0.0149, CVaR(95%): -0.0200
- PennyLane VQC <Z0>: 0.5283
- T4 Chronos zero-shot directional accuracy: ~44.8% (record as your baseline)

## Manual steps remaining

1. Create API keys (steps 7-9): copy `.env.example` to `.env` and fill values.
   - IBM Quantum: `QiskitRuntimeService.save_account(channel="ibm_quantum", token=...)`
   - Alpaca / Polygon: export the env vars (or load `.env`).
2. Datasets (Drop 4 §2): download links are in the Slack `#datasets` channel
   (LOB tick data, earnings transcripts, volatility surface). OHLCV is available via
   `yfinance` / Alpaca already.
3. Starter repo (step 10): obtain your track's repo via Slack, then
   `cd repo && python baseline.py`.

## Notes

- `chronos-forecasting` pinned `transformers==4.57.6` and `huggingface_hub==0.36.2`;
  `autogluon.timeseries` pinned `numpy 2.1.3`, `torch 2.9.1`, `pandas 2.3.3`.
- Harmless resolver warning: `datasets` wants `pyarrow>=21` but autogluon pins `20.0.0`;
  `datasets` still imports and runs fine.
- The QAOA toy uses `qiskit.primitives.StatevectorSampler` (qiskit 2.x removed the V1
  `Sampler`; Aer's sampler can't run the un-transpiled QAOA ansatz gate).
