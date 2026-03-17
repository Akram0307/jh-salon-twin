# SalonOS Production Infrastructure

## Overview
Production-grade infrastructure for SalonOS on Google Cloud Platform.
All resources are provisioned with high-availability, automated backups, and
zero-trust secret management. No plaintext secrets exist in any configuration.

## Architecture

```
                    ┌─────────────────────┐
                    │   Cloud CDN / LB    │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ┌────────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
     │ Frontend (Nx) │ │  Backend   │ │  Backend   │
     │ min:1 max:5   │ │ min:2 max:10│ │ min:2 max:10│
     │ 512Mi 1CPU    │ │ 1Gi  2CPU  │ │ 1Gi  2CPU  │
     └───────┬───────┘ └─────┬──────┘ └─────┬──────┘
             │               │               │
             └───────────────┼───────────────┘
                             │
                  ┌──────────▼──────────┐
                  │  VPC Connector      │
                  │  salonos-prod-vpc   │
                  │  min:2 max:10       │
                  │  e2-micro           │
                  └──────────┬──────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
     │ Cloud SQL HA  │ │  Redis   │ │  Secret    │
     │ db-custom     │ │ Standard │ │  Manager   │
     │ 2-4096        │ │  1GB     │ │            │
     │ 7-day backup  │ │          │ │            │
     └───────────────┘ └──────────┘ └────────────┘
```

## Prerequisites

1. **GCP CLI** installed and authenticated:
   ```bash
   gcloud auth login
   gcloud config set project salon-saas-487508
   ```

2. **Required IAM roles** on the executing user:
   - Compute Admin (`roles/compute.admin`)
   - Cloud SQL Admin (`roles/cloudsql.admin`)
   - Redis Admin (`roles/redis.admin`)
   - Secret Manager Admin (`roles/secretmanager.admin`)
   - IAM Admin (`roles/iam.admin`)
   - Cloud Run Admin (`roles/run.admin`)

3. **All secrets must be set** in Secret Manager before deployment:
   ```bash
   ./provision-infrastructure.sh   # Creates placeholders
   # Then manually set real values for TWILIO_*, SMTP_*, ENCRYPTION_KEY
   ```

4. **Staging must be healthy** before production deploy (verified by deploy script).

## Deployment Steps

### 1. Provision Infrastructure (first time only)
```bash
./provision-infrastructure.sh
```
This creates: VPC connector, Cloud SQL (HA), Redis (standard tier),
Secret Manager secrets, and service account.

### 2. Set Production Secrets
Replace placeholder secrets with real values:
```bash
echo -n "your-real-value" | \
  gcloud secrets versions add salonos-prod-TWILIO_ACCOUNT_SID \
  --data-file=- --project=salon-saas-487508
```

### 3. Deploy
```bash
./deploy-production.sh              # Full deploy (frontend + backend)
./deploy-production.sh --backend     # Backend only
./deploy-production.sh --frontend    # Frontend only
```

The deploy script performs:
- Pre-flight checks (secrets exist, DB reachable, staging healthy)
- Blue-green deployment (new revision → health check → traffic shift)
- Automatic rollback on failure
- Release tag generation

### 4. Verify
```bash
# Check service health
gcloud run services describe salonos-backend-prod \
  --region=us-central1 --format='value(status.url)'

# Check recent logs
gcloud logging read "resource.type=cloud_run_revision \nresource.labels.service_name=salonos-backend-prod" \
  --limit=20 --project=salon-saas-487508
```

## Rollback Procedure

### Quick Rollback (last 5 revisions)
```bash
./rollback.sh
# Select revision from the list
```

### Manual Rollback
```bash
# List revisions
gcloud run revisions list --service=salonos-backend-prod \
  --region=us-central1 --limit=5

# Rollback to specific revision
gcloud run services update-traffic salonos-backend-prod \
  --region=us-central1 \
  --to-revisions=salonos-backend-prod-XXXXX=100
```

### Database Rollback
```bash
# Cloud SQL automated backups are retained for 7 days
# Restore from a specific backup:
gcloud sql backups restore \
  --backup-instance=salonos-prod-db \
  --backup-id=BACKUP_ID \
  --restore-instance=salonos-prod-db \
  --project=salon-saas-487508

# Point-in-time recovery
gcloud sql instances clone salonos-prod-db salonos-prod-db-restore \
  --point-in-time="2026-03-17T10:00:00Z" \
  --project=salon-saas-487508
```

## Production vs Staging Differences

| Resource | Staging | Production |
|----------|---------|------------|
| Cloud SQL tier | db-f1-micro | db-custom-2-4096 |
| Cloud SQL HA | No | Yes (regional) |
| Backup retention | Default (1 day) | 7 days |
| Redis tier | BASIC | STANDARD |
| VPC connector max | 3 | 10 |
| Backend min instances | 0 | 2 |
| Backend CPU | 1 | 2 |
| Backend timeout | 60s | 300s |
| Frontend min instances | 0 | 1 |
| Startup probe | No | 60s |
| Liveness probe | No | 30s |
| Deploy strategy | Direct | Blue-green |
| Pre-flight checks | No | Yes |

## Files

| File | Purpose |
|------|---------|
| `provision-infrastructure.sh` | Create all GCP resources (idempotent) |
| `cloudrun-production.yaml` | Cloud Run service specifications |
| `env-production.yaml.example` | Environment variable template (Secret Manager refs) |
| `deploy-production.sh` | Blue-green deployment with pre-flight checks |
| `rollback.sh` | Quick rollback to previous revisions |
| `README.md` | This file |

## Incident Response

1. **Service down**: Run `./rollback.sh` immediately
2. **DB issues**: Check Cloud SQL metrics in Cloud Console → Operations
3. **Redis issues**: Check Memorystore metrics; standard tier auto-failovers
4. **Secret rotation**: Update secret version in Secret Manager; redeploy to pick up

## Cost Estimates (Monthly)

- Cloud SQL (db-custom-2-4096, HA): ~$150-200
- Memorystore Redis (1GB, standard): ~$50
- VPC Connector (2 min e2-micro): ~$17
- Cloud Run (2 min backend + 1 min frontend): ~$30-80 (usage-dependent)
- Secret Manager: ~$0.06/secret/month
- **Total estimate**: ~$250-350/month
