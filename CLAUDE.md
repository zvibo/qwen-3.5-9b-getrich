# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A local-first sentiment-driven trading dashboard. A FastAPI backend ingests RSS articles into a DB queue, runs a two-stage local-Ollama LLM pipeline (Stage 1 entity extraction + Stage 2 financial reasoning), overlays FRED/EIA validation data and locally-computed technical indicators, and emits BUY/SELL/HOLD recommendations for `USO`, `BITO`, `QQQ`, `SPY` (plus optional custom symbols). A Next.js 16 / React 19 dashboard renders signals, paper-trading P&L, and admin controls. Auto-runs every 30 minutes.

The app is intentionally local-only: backend binds `127.0.0.1`, SQLite database, secrets stored in OS keychain via `keyring`. Not financial advice.

## Run / build / test

Use **Python 3.12 exactly** (Playwright path is not tested on 3.14+). Node 20.9+. Ollama must be running with at least one compatible model pulled (`qwen3.5:9b`, `qwen3:8b`, `0xroyce/plutus:latest` are known to work).

```bash
# Backend (from repo root)
pip install -r requirements.txt
python run.py                              # always launch via run.py, not `uvicorn main:app`

# Frontend
cd frontend && npm install && npm run dev  # Next.js dev server on :3000
npm run build                              # production build
npm run lint                               # next lint

# Backend tests (pytest)
cd backend && pytest                       # run all
pytest tests/test_market_validation.py     # single file
pytest tests/test_market_validation.py::test_name  # single test

# Stage 1 keyword-extraction smoke test (no full pipeline run, no RSS, no prices)
cd backend && python test_stage1.py
cd backend && python test_stage1.py llama3.2:latest   # override model

# DB migration (auto-runs on backend startup; this is only for manual verification)
cd backend && python -m database.migrate

# Playwright e2e (configs live in backend/, tests in backend/tests/ and backend/e2e/)
cd backend && npx playwright test
```

`run.py` is the canonical backend entrypoint — **do not bypass it**:
- On Windows it sets `WindowsProactorEventLoopPolicy` before Uvicorn starts (Playwright subprocesses break otherwise).
- It defaults `UVICORN_RELOAD=off` on Windows because reload mode swaps the event loop back and breaks Playwright. macOS/Linux default reload to on.
- It prepends `backend/` to `sys.path`, so backend modules import as top-level (`from services...`, `from database...`, `from routers...`) — keep that convention when adding files.

Useful environment variables: `OLLAMA_MODEL`, `OLLAMA_URL`, `HOST`, `PORT`, `UVICORN_RELOAD`, `INGESTION_STARTUP_GRACE_SECONDS`, `ADMIN_API_TOKEN` (gates `GET/PUT /api/v1/config` and `POST /api/v1/trades/{id}/execute` via `X-Admin-Token`), `CORS_ORIGINS`.

## Architecture — the parts you need to read multiple files to understand

### Producer/consumer ingestion (decoupled from analysis)
The classic mental model — "an analysis run scrapes the web and analyzes" — is **wrong** here.

- A background task `_data_ingestion_scheduler_loop` in `backend/main.py` polls RSS feeds via `services/data_ingestion/worker.py:run_ingestion_cycle`, runs a Stage 0 relevance filter, extracts full article text, and writes rows to the `scraped_articles` table with `processed=False`.
- The `/api/v1/analyze/stream` path (`routers/analysis.py`) **consumes** queued `processed=False` rows and marks them processed. It does not scrape inline.
- High-impact macro headlines set `fast_lane_triggered=True` and can kick off a Fast Lane off-cycle analysis run for the affected symbols.
- An "analysis lease" (fields `analysis_lock_request_id` / `analysis_lock_acquired_at` / `analysis_lock_expires_at` on `app_config`) coordinates between the scheduled run and an urgent off-cycle run so they don't process the same queued articles in parallel. The ingestion loop also defers while a lease is active to reduce SQLite write contention. Respect this lease when adding new long-running jobs that touch articles or the analysis tables.

### Two-stage LLM pipeline (services/sentiment/engine.py)
- **Stage 1** = entity extraction. Built-in symbols (USO/BITO/QQQ/SPY) use a static keyword map and make **no LLM call**. Custom symbols call the LLM **once per session** via `_generate_symbol_keywords` to produce 15–20 proxy keywords; results live in `_keyword_cache` for the lifetime of the process. Article filtering is then pure keyword matching. Restarting the server re-generates these.
- **Stage 2** = financial reasoning. Receives only Stage 1's filtered articles plus the proxy-term context, plus per-symbol validation context, plus technical indicators when available.
- Pipeline depth (`Light` / `Normal` / `Detailed`) is set per run from Admin and changes which models are required:
  - Light: one model for both stages.
  - Normal: two-stage only when both `extraction_model` and `reasoning_model` are configured; falls back to single-stage otherwise.
  - Detailed: both required.
- After the per-symbol blue-team signal, a **red-team** review challenges the thesis (regime, sentiment-vs-technical divergence, source bias, portfolio correlation). The displayed recommendation is the consensus signal; the original is retained for audit. Override thresholds live in `backend/config/logic_config.json → red_team`.

### Per-symbol validation injection
Validation context is **per-symbol**, not one shared block. Each specialist prompt gets a narrowed bundle:
- `USO` → `EIA` weekly petroleum (refinery utilization, crude/gasoline/distillate stocks)
- `BITO` → `FRED` `M2SL`, `M2REAL`
- `QQQ` → `FRED` `DFII10` (10y TIPS real yield)
- `SPY` → `FRED` `BAMLH0A0HYM2`, `BAMLC0A0CM` (credit spreads)
- Custom symbols receive no validation bundle (Stage 1 keyword filter only).

When price history is present, 7 indicators (RSI, SMA50/200 with Golden/Death Cross, MACD, Volume Profile, Bollinger %B, ATR, OBV trend) are computed locally from `price_history` (numpy only) and appended to the prompt. Missing history = indicator omitted, not error.

### Execution mapping (services/trading_instruments.py)
Analysis reasons about the underlying (`USO`, `BITO`, `QQQ`, `SPY`); the recommendation layer maps `(direction, leverage)` → broker-tradable execution ticker before persisting and rendering. Bullish QQQ 3x → `BUY TQQQ`, bearish SPY 3x → `BUY SPXS`, bullish USO 2x → `BUY UCO`, etc. Bitcoin and oil are capped at 2x. The price panel shows underlying + execution tickers.

### Trading logic config (backend/config/logic_config.json)
All scoring weights, entry thresholds, materiality gate, red-team thresholds, conviction/holding-window timing (in minutes), ATR-scaled leverage caps, and trailing-stop tighten factor live here. **Six fields are also editable via Admin → Trading Logic and stored in the DB; the DB value takes precedence over JSON for those.** See `LOGIC.md` for the conceptual reference (what a thesis flip is, how confidence is computed, what makes red-team override allowed). When changing trading behavior, update the JSON defaults and `LOGIC.md` in the same change.

### Paper trading (services/paper_trading.py)
Every analysis run auto-simulates a $100 paper trade per signal during 4am–8pm ET Mon–Fri. The `paper_trades` table is **independent of all other analysis tables** — `reset-data` does not touch it, and analysis pruning does not touch it. Position lifecycle: signal flip closes + reopens, HOLD-on-open sets a tightened trailing stop using `best_price_seen` (does not force-close), conviction window resets when same-direction is reconfirmed (capped by `max_holding_minutes`).

### Materiality gate (thesis-flip prevention)
Before allowing a LONG↔SHORT flip, at least one of: ≥6 new articles, ≥0.24 sentiment delta, or price move ≥ ATR×0.5 (bounded 0.75%–3.0%). The article-count threshold is **dynamic per-symbol** once 5 runs of history exist (rolling mean ± 1σ over last 20 runs); fixed threshold is the fallback.

### Database (backend/database/)
SQLite via SQLAlchemy ORM. `database.engine.SessionLocal` is the session factory; `database.models.init_db` creates tables. Migrations run automatically on every backend startup via `migrate.py` — do not write manual SQL or expect users to. To add a column or table, add it to `models.py` **and** add a guarded `ALTER TABLE` / `CREATE TABLE IF NOT EXISTS` step in `migrate.py` so existing user databases upgrade in place. The README contains the canonical migration table; keep it in sync.

The `price_history` table is a deliberate exception: it survives `reset-data`, has its own delta-pull flow in Admin, and feeds the technical indicators.

### Frozen snapshot replay (Advanced Mode)
Every analysis run saves a frozen snapshot of its inputs (articles, prices, validation context, exact per-symbol prompts) and outputs. `POST /api/v1/analysis-snapshots/{request_id}/rerun` replays that exact dataset against a different model or model pair without re-downloading anything. Reruns are themselves saved as new snapshots with their model config recorded, so they can serve as regression baselines. Snapshot retention is configurable in Admin.

### Frontend layout (frontend/src/app/)
Next.js App Router. Top-level routes:
- `page.tsx` — main dashboard (live SSE feed, signal cards, charts, Advanced/Compare mode)
- `admin/page.tsx` — settings, custom symbols/feeds, prompt overrides, price history pull, remote snapshot delivery
- `health/` — runtime, model, and data-pull visibility
- `trading/` — paper trading equity curve, open positions, closed history
- `api/` — Next API routes that proxy to the FastAPI backend (e.g. `api/admin/price-history/pull/route.ts`, `api/paper-trading/route.ts`). Frontend code calls these proxies, not the FastAPI server directly, so admin tokens and CORS work consistently.

### Remote snapshot delivery
After a qualifying run, an outbound PNG of the dashboard can be sent to Telegram. The bot token / chat id are saved through `services/secret_store.py` (which wraps `keyring`) and only masked status is shown in the UI — **never log or echo these secrets back**. Resend gating uses `min_pnl_change_usd` + `heartbeat_minutes`; the "Send Snapshot Now" admin action bypasses gates.

## Conventions

- Python imports inside `backend/` are top-level (`from services.x import y`) because `run.py` puts `backend/` on `sys.path`. Don't write `from backend.services...`.
- The backend speaks to Ollama only — there is no external LLM API. When the dashboard shows an "active model", it's whatever Ollama is currently serving (`services/ollama.py:get_ollama_status`), not a hardcoded constant.
- Don't introduce new `print` calls into hot paths — prefer the existing schedulers' compact one-line summaries. The uvicorn access log already filters `/api/v1/prices` (poll noise) via `_SuppressPricesAccessLog` in `main.py`.
- When adding admin-editable behavior, follow the existing pattern: default in `logic_config.json`, override column on `app_config` (with migration), Admin UI field that submits to `PUT /api/v1/config`, and DB-takes-precedence resolution at read time.
- Don't create migrations that drop columns or rewrite data destructively — the migration runs on every startup against user-owned local databases.
