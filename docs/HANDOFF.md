# AgentForge — Handoff / Migration Notes

> Purpose: hand this project to another agent (or developer) with an accurate
> picture of what exists, what's stubbed, and what's next. Verified against the
> source on **2026-07-23**, not from memory. Read [CLAUDE.md](../CLAUDE.md)
> first — it is the authoritative contract; this doc is the current-state map.

There was no prior plan file in the repo; this is the first one. `CLAUDE.md`
describes the *intended* system; this doc describes how far the build has
actually gotten toward it.

---

## 1. One-line status

The **backend orchestration core is real and tested**; the **frontend is a
mock-first UI not yet wired to the API**; several **node types, the provider
layer, and the engine's reliability guarantees (timeout/retry/cancel) are not
built yet**.

---

## 2. What exists and is real

### Backend — Python (`libs/`, `services/`)

| Area | File(s) | State |
|------|---------|-------|
| Domain schemas | `libs/schemas/.../graph.py`, `run.py`, `events.py`, `run_events.py`, `node_configs.py` | Real. Pydantic v2. **Only `ConstantConfig` node config exists** — see gap below. |
| DAG scheduler | `libs/engine/.../scheduler.py` | Real. `topological_order` (rejects cycles / edges to unknown nodes), `RunScheduler` (in-degree waves, `mark_complete`). Well tested. |
| Run streamer | `libs/engine/.../runner.py` | Real. `stream_run` runs ready nodes concurrently per wave, funnels events through a queue, **isolates failures** (a failed node fails only itself; its downstream subtree is emitted as `skipped`), and `run_graph` projects a final result from events. |
| Node registry | `libs/engine/.../registry.py` | Real. **Fails closed** on unknown types; rejects duplicate registration. |
| Executors | `libs/engine/.../executors.py` | **Only `ConstantExecutor` (a `source` that emits a fixed value).** No agent/tool/router/output executors yet. |
| DB models + migration | `libs/db/.../models.py`, `session.py`, `migrations/versions/08ff93ed5ec0_initial_schema.py` | Real. Async SQLAlchemy 2.0. One migration (initial schema). |
| API — workflows | `services/api/app/routers/workflows.py` | Real. `POST /workflows/validate`, `POST /workflows`, `POST /workflows/{id}/versions` (publish = validate + freeze, monotonic version number). |
| API — runs | `services/api/app/routers/runs.py` | Real. `POST /versions/{id}/runs` (create + **enqueue**, never executes inline), `GET /runs/{id}`, **`WS /runs/{id}/events`** (forwards Redis pub/sub to client). |
| Worker | `services/worker/worker/execute.py`, `publisher.py`, `settings.py` | Real. `execute_run` drives the engine and **persists each state change before emitting its event** (per CLAUDE.md §5). |

**Architecture invariants that ARE honored today:** API enqueues / worker
executes (no inline node execution); async all the way; persist-before-emit;
registry fails closed; cycles rejected at publish.

### Frontend — TypeScript (`apps/web`, `packages/`)

- **Mock-first UI, 56 files.** Pages: `editor`, library (`/`), `sources`,
  `tools`, `routers`, `outputs`, `observability`, `infrastructure`.
- React Flow canvas (`components/editor/flow-canvas.tsx`, `node-card.tsx`,
  `inspector.tsx`), "bench" chrome (`components/bench/*`), Zustand stores
  (`stores/canvas-store.ts`, `run-store.ts`, `ui-store.ts`).
- All data comes from `apps/web/lib/mock/*`. **Not connected to the real API/WS.**
- Design system tokens live in `packages/ui` (per CLAUDE.md §11 "precision
  engineering bench" identity).

### Tests (present — not re-run in this session)

`libs/engine/tests/*` (scheduler, runner, registry, executors, run events),
`libs/db/tests`, `services/api/tests/*` (health, workflows, run lifecycle, WS),
`services/worker/tests/*` (execute, integration), and frontend
`apps/web/**/__tests__/*`. **Verify green before building on them:**
`uv run pytest` and `pnpm --filter web test`.

---

## 3. Gaps — what is NOT built yet (the real backlog)

Ordered roughly by dependency. Each node-type item must follow **CLAUDE.md §6**
end-to-end (config schema → executor → registry → palette/inspector → tests).

1. **Provider layer `libs/providers` — MISSING.** CLAUDE.md §2/§6 require all
   LLM/network calls to go through it. It does not exist yet. Blocks every
   `agent` node.
2. **Real node types.** Only `constant` exists. Need at minimum: `agent`
   (LLM via LangGraph + provider), `tool` (search/http/code — sandbox the
   `code` tool per §10), `router` (conditional branch enable/disable),
   `output` (sink). Each needs a Pydantic config in `libs/schemas` +
   executor + registry entry + palette/inspector form + tests.
3. **Router branching semantics.** The scheduler does DAG waves + failure-skip,
   but a `router` disabling a subset of downstream edges (CLAUDE.md §5.4) is
   not implemented.
4. **Engine reliability guarantees — NOT implemented:** per-node **timeout**,
   **retry-with-backoff**, **cancellation** (must cancel the in-flight async
   task, not just dequeue), and **idempotency per `(run_id, node_id, attempt)`**.
   Note: `NodeExecution` is written with a hardcoded `attempt=1` in
   `worker/execute.py` — retries will need real attempt tracking.
5. **Token / cost / latency aggregation.** `runner.py` supports `NodeToken`
   streaming deltas, but no executor emits them and `_apply` explicitly does
   not persist them. `Run.tokens_in/out`, `cost_cents`, `latency_ms` are not
   populated.
6. **Contract generation.** `packages/types/src/index.ts` is an **empty stub**;
   `make gen-types` has never been run. The frontend uses a hand-written local
   mirror at `apps/web/lib/domain.ts`. Per CLAUDE.md §3 this must be generated
   from the FastAPI OpenAPI spec.
7. **Frontend ↔ backend wiring.** Replace `lib/mock/*` with real API calls,
   subscribe the run store to the `WS /runs/{id}/events` stream, drive the
   canvas from live events. This is the "pending next slice" in memory.

---

## 4. Suggested next slice for the incoming agent

The highest-value, lowest-risk first move is to **make one real end-to-end run
visible in the UI**:

1. Run `uv run pytest` + `pnpm --filter web test` to confirm a green baseline.
2. `docker compose up -d`, `uv run alembic upgrade head`.
3. `make gen-types` → replace `apps/web/lib/domain.ts` mirror with
   `packages/types`.
4. Wire the library/editor pages to `POST /workflows` → publish → create run,
   and subscribe `run-store` to `WS /runs/{id}/events`.
5. With only the `constant` node, you can already publish → run → stream a real
   Run. Then start adding real node types (§3.2) behind the new provider layer.

## 5. Commands (from CLAUDE.md §7)

```bash
docker compose up -d
uv sync
uv run fastapi dev services/api/app/main.py
uv run arq worker.settings.WorkerSettings
uv run ruff check . && uv run ruff format . && uv run mypy . && uv run pytest
uv run alembic upgrade head
pnpm --filter web dev
pnpm --filter web lint && pnpm --filter web typecheck
make gen-types
```

## 6. Non-obvious context worth carrying over

- The design source is **Figma** (file key `wJDSbp1MTNpTuv7L63Y2Fv`), pulled via
  the Figma MCP. The UI was built from it mock-first — don't guess UI, pull the
  design.
- `libs/schemas` is the **source of truth** for domain + node config types; the
  frontend contract is generated from it, never hand-defined.
- Definition of done for backend: `ruff check`, `ruff format`, `mypy` (strict),
  `pytest` all pass. See CLAUDE.md §12.
