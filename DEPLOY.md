# Deployment Guardrail: Smoke Before Deploy

## Rule

**No backend Cloud Run deployment should be executed until the schedule CRUD smoke suite passes.**

The source-of-truth verification is:

- `/a0/usr/projects/jh_salon_twin/backend/scripts/schedule_crud_smoke.js`

This suite validates:

- live owner schedule CRUD routing
- smart seed creation on an empty slot
- update and delete behavior using the created UUID
- overlap protection returning `409 Conflict`
- cleanup of seeded state after execution

## Gatekeeper script

Use the root-level gatekeeper script:

- `/a0/usr/projects/jh_salon_twin/gatekeeper.sh`

### Dry run smoke only

```bash
cd /a0/usr/projects/jh_salon_twin
./gatekeeper.sh
```

### Smoke + deploy

```bash
cd /a0/usr/projects/jh_salon_twin
./gatekeeper.sh --image gcr.io/salon-saas-487508/salonos-backend:20260308TXXXXXXZ --deploy
```

## Required behavior

1. Run smoke suite first.
2. Abort immediately on any non-zero exit code.
3. Only deploy the **explicit image reference** passed via `--image`.
4. Do not rely on implicit or stale image defaults during release execution.

## Notes

- Preferred deploy inputs should use a **unique image tag or exact immutable image reference** to avoid version drift.
- The smoke report is written to:
  - `/a0/usr/projects/jh_salon_twin/backend/scripts/schedule_crud_smoke_report.json`
- The live backend URL under test is currently:
  - `https://salonos-backend-rgvcleapsa-uc.a.run.app`

## Suggested release flow

```bash
# 1) build/push image using your normal release process
# 2) gate with smoke verification
./gatekeeper.sh --image gcr.io/salon-saas-487508/salonos-backend:<unique-tag> --deploy
```

## Commit conventions

Use repository commit prefixes such as:

- `fix:`
- `chore:`
- `docs:`
- `release(production):`
