# Deployment Safety Gate

## Rule

**No backend Cloud Run deployment should be executed until both the chat contract smoke suite and the schedule CRUD smoke suite pass.**

## Source-of-truth smoke checks

The source-of-truth verification set is:

- `/a0/usr/projects/jh_salon_twin/backend/scripts/chat_contract_smoke.sh`
- `/a0/usr/projects/jh_salon_twin/backend/scripts/schedule_crud_smoke.js`

These suites validate:

- live chat contract heartbeat and response shape
- live owner schedule CRUD routing
- smart seed creation on an empty slot
- update and delete behavior using the created UUID
- overlap protection returning `409 Conflict`
- cleanup of seeded state after execution

## Gatekeeper workflow

Use the project root gatekeeper:

```bash
./gatekeeper.sh --image gcr.io/salon-saas-487508/salonos-backend:<unique-tag> --deploy
```

### Gatekeeper behavior

1. Run chat contract smoke first.
2. Run schedule CRUD smoke second.
3. Abort immediately on any non-zero exit code from either suite.
4. Only deploy the **explicit image reference** passed via `--image`.
5. Do not rely on implicit or stale image defaults during release execution.

## Reports

The smoke reports are written to:

- `/a0/usr/projects/jh_salon_twin/backend/scripts/chat_heartbeat_report.json`
- `/a0/usr/projects/jh_salon_twin/backend/scripts/schedule_crud_smoke_report.json`

## Validation-only mode

To run checks without deploying:

```bash
./gatekeeper.sh
```


## Gatekeeper validation coverage

The gatekeeper now validates all of the following before deploy:

- frontend branding verification
- backend chat contract smoke
- frontend owner dashboard Playwright regression
- backend schedule CRUD smoke
