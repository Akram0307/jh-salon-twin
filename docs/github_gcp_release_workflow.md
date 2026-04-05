# GitHub + GCP Release Workflow

## Purpose
Formalize how SalonOS code moves from local success to a durable GitHub deployment record.

## Required rule
Only create a release tag **after** the GCP deployment is confirmed successful.

## Standard command
```bash
./scripts/release_after_gcp_success.sh production owner-backend-frontend "deployment summary"
```

## Output
The workflow produces:

1. a pushed commit on `main`
2. an annotated git tag
3. a durable GitHub release marker by timestamped tag

## Tag pattern
```text
release/<environment>/YYYY.MM.DD-HHMMSS
```

## Examples
```bash
./scripts/release_after_gcp_success.sh production owner-frontend "owner dashboard route restoration"
./scripts/release_after_gcp_success.sh production backend "analytics routes and waitlist recovery fixes"
./scripts/release_after_gcp_success.sh staging owner-backend-frontend "pre-production validation pass"
```
