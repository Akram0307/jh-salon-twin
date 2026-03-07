# SalonOS / JH Salon Twin

Premium AI-native salon revenue operating system with:

- **Owner PWA** for control tower operations
- **Backend services** for booking, AI demand, CRM, analytics, and POS intelligence
- **Shared database/migration layer** for salon operations and revenue workflows

## Repository

GitHub repository:

- **https://github.com/Akram0307/jh-salon-twin**

---

## Monorepo structure

| Area | Path | Purpose |
|---|---|---|
| Frontend | `/frontend` | React + Vite PWA |
| Backend | `/backend` | Node/TypeScript API and services |
| Database | `/db` | SQL schemas and migrations |
| Skills | `/skills` | Project-specific Agent Zero skills |
| Scripts | `/scripts` | Git/GCP maintenance and release helpers |

---

## Formal GitHub maintenance workflow

This repo is now the **source-controlled record of every successful GCP deployment**.

### Operational rule
After a deployment is confirmed successful in GCP / Cloud Run:

1. commit the final working code state
2. push to `main`
3. create a release tag for that successful deployment

This ensures GitHub always reflects a real deployed state, not just local progress.

---

## Release scripts

### 1. Sync latest successful state

```bash
cd /a0/usr/projects/jh_salon_twin
./scripts/git_sync_after_gcp_success.sh "chore: sync successful GCP deployment"
```

### 2. Create a formal deployment release

```bash
cd /a0/usr/projects/jh_salon_twin
./scripts/release_after_gcp_success.sh production owner-backend-frontend "successful GCP deployment"
```

Arguments:

| Argument | Example | Meaning |
|---|---|---|
| 1 | `production` | Environment |
| 2 | `owner-backend-frontend` | Service scope |
| 3 | `successful GCP deployment` | Release summary |
| 4 | `main` | Branch, optional |

Example with more detail:

```bash
./scripts/release_after_gcp_success.sh production owner-frontend "fix owner dashboard API stability"
```

---

## Versioning convention

This project uses a **deployment-based release versioning model**.

### Tag format

```text
release/<environment>/YYYY.MM.DD-HHMMSS
```

Examples:

- `release/production/2026.03.07-223000`
- `release/staging/2026.03.08-101500`

### Why this model

It fits the current operating style better than package-semver because deployments may involve:

- backend changes
- frontend changes
- routing fixes
- infrastructure/runtime patches
- coordinated Cloud Run releases

This makes each tag a trustworthy deployment snapshot.

---

## Commit convention

Recommended commit prefixes:

| Prefix | Use case |
|---|---|
| `feat:` | new functionality |
| `fix:` | bug fix |
| `refactor:` | code restructuring without behavior change |
| `docs:` | documentation updates |
| `chore:` | maintenance, tooling, cleanup |
| `release(production):` | successful production deployment sync |
| `release(staging):` | successful staging deployment sync |

Examples:

- `feat: add owner route shell for canonical portal`
- `fix: normalize dashboard array responses to prevent map crashes`
- `release(production): owner dashboard backend/frontend deployed successfully [2026-03-07T22:30:00Z]`

---

## Branch policy

Current default branch:

- `main`

Recommended operational policy:

- use `main` for validated deployable work
- do implementation work in local commits before deployment
- after a successful GCP deployment, run the release script to preserve the exact shipped state

---

## Suggested deployment discipline

For every production push:

1. make code changes
2. validate builds/tests
3. deploy to GCP / Cloud Run
4. confirm deployment success
5. run:

```bash
./scripts/release_after_gcp_success.sh production owner-backend-frontend "describe what shipped"
```

This creates:

- a final git commit if needed
- a push to GitHub
- an annotated release tag

---

## Optional wrapper

A placeholder wrapper exists here:

- `/a0/usr/projects/jh_salon_twin/scripts/deploy_and_release_example.sh`

This can be connected later to the exact backend/frontend Cloud Run deploy commands so release sync happens automatically after successful deployment completion.

---

## Notes

- Secrets and credential files are ignored by git.
- Large generated artifacts and local binaries are excluded from routine version control.
- GitHub is now the maintained code history for successful deployment states.
