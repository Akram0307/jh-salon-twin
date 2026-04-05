# SalonOS Disaster Recovery Runbook

## Overview
This runbook provides step-by-step procedures for recovering SalonOS from various disaster scenarios.

## Recovery Time Objective (RTO) & Recovery Point Objective (RPO)
| Metric | Target | Actual |
|--------|--------|--------|
| RTO (Recovery Time Objective) | 4 hours | TBD |
| RPO (Recovery Point Objective) | 1 hour | TBD |

---

## 1. Database Recovery

### 1.1 Automated Backup Location
- **Primary**: Google Cloud Storage `gs://salonos-db-backups/daily/`
- **Retention**: 30 days
- **Schedule**: Daily at 2:00 AM UTC

### 1.2 Manual Database Restore

```bash
# 1. Identify the latest backup
BACKUP_FILE=$(gsutil ls gs://salonos-db-backups/daily/ | sort | tail -1)
echo "Restoring from: $BACKUP_FILE"

# 2. Download backup locally
gsutil cp $BACKUP_FILE /tmp/latest_backup.sql.gz

# 3. Decompress
gunzip /tmp/latest_backup.sql.gz

# 4. Stop application (scale to 0)
gcloud run services update salonos-backend --region us-central1 --min-instances 0

# 5. Restore database
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME';"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d postgres < /tmp/latest_backup.sql

# 6. Verify restore
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM appointments;"

# 7. Restart application
gcloud run services update salonos-backend --region us-central1 --min-instances 1
```

### 1.3 Point-in-Time Recovery (PITR)

```bash
# For Cloud SQL with PITR enabled
gcloud sql instances restore $INSTANCE_ID   --restore-instance-name=salonos-db-restored   --backup-id=BACKUP_ID   --point-in-time=2026-03-14T10:00:00Z
```

---

## 2. Cloud Run Service Recovery

### 2.1 Backend Service Recovery

```bash
# Check current status
gcloud run services describe salonos-backend --region us-central1

# Rollback to previous revision
gcloud run services update-traffic salonos-backend   --region us-central1   --to-revisions=PREVIOUS_REVISION

# Or deploy specific revision
gcloud run deploy salonos-backend   --image=gcr.io/salon-saas-487508/salonos-backend:PREVIOUS_TAG   --region us-central1
```

### 2.2 Frontend Service Recovery

```bash
# Owner PWA (Next.js)
gcloud run services update-traffic salonos-owner-frontend   --region us-central1   --to-revisions=PREVIOUS_REVISION

# Client PWA
gcloud run services update-traffic salonos-client-frontend   --region us-central1   --to-revisions=PREVIOUS_REVISION
```

### 2.3 Full Stack Recovery

```bash
# Run the redeploy script
./scripts/redeploy_backend_cloudrun.sh

# Or manual full deploy
gcloud builds submit --config=cloudbuild.yaml .
```

---

## 3. DNS Failover Configuration

### 3.1 Health Check Setup
```bash
# Create health check
gcloud compute health-checks create http salonos-health-check   --port=8080   --request-path=/api/health
```

### 3.2 DNS Update
```bash
# Update Cloud DNS record
gcloud dns record-sets update api.salonos.app   --zone=salonos-zone   --type=A   --rrdatas=NEW_IP   --ttl=60
```

---

## 4. Contact Escalation Matrix

| Severity | Contact | Response Time |
|----------|---------|---------------|
| P0 - Critical | On-call Engineer | 15 minutes |
| P1 - High | Team Lead | 1 hour |
| P2 - Medium | Team Slack | 4 hours |
| P3 - Low | Ticket System | 24 hours |

### On-Call Rotation
- **Primary**: DevOps Platform Lead
- **Secondary**: Backend Architect
- **Escalation**: Project Owner

---

## 5. Recovery Checklists

### 5.1 Database Down Checklist
- [ ] Check Cloud SQL instance status
- [ ] Review error logs: `gcloud sql instances describe salonos-db`
- [ ] Check disk space: `gcloud sql instances describe salonos-db --format="value(diskUsage)"`
- [ ] Restore from backup if needed
- [ ] Verify application connectivity
- [ ] Update status page

### 5.2 Backend Service Down Checklist
- [ ] Check Cloud Run service status
- [ ] Review logs: `gcloud run services logs read salonos-backend --region us-central1 --limit=100`
- [ ] Check for recent deployments
- [ ] Rollback to last known good revision
- [ ] Verify health endpoint: `curl https://api.salonos.app/api/health`
- [ ] Notify stakeholders

### 5.3 Complete Outage Checklist
- [ ] Activate incident response team
- [ ] Check GCP Status Dashboard
- [ ] Verify DNS resolution
- [ ] Check Cloud Load Balancer status
- [ ] Restore services in order: Database → Backend → Frontend
- [ ] Run smoke tests
- [ ] Update status page
- [ ] Conduct post-mortem

---

## 6. Monitoring & Alerting

### 6.1 Key Metrics to Monitor
- API response time (p95 < 500ms)
- Error rate (< 1%)
- Database connections (< 80% of max)
- Memory usage (< 85%)
- CPU usage (< 70%)

### 6.2 Alert Channels
- **Slack**: #salonos-alerts
- **Email**: ops@salonos.app
- **PagerDuty**: (if configured)

---

## 7. Testing Recovery Procedures

### 7.1 Monthly DR Drill
1. Schedule maintenance window
2. Simulate database failure
3. Execute recovery procedures
4. Measure actual RTO/RPO
5. Document findings
6. Update runbook

### 7.2 Verification Steps
```bash
# Run smoke tests
npm run test:smoke

# Check all services
curl -s https://api.salonos.app/api/health | jq .
curl -s https://salonos.app | head -5

# Verify database
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;"
```

---

## 8. Post-Recovery Actions

1. **Verify Data Integrity**: Run data validation scripts
2. **Update Documentation**: Record incident details
3. **Communicate**: Notify affected users
4. **Post-Mortem**: Schedule within 48 hours
5. **Improve**: Update procedures based on learnings

---

*Last Updated: 2026-03-14*
*Owner: DevOps Platform Lead*
*Review Schedule: Monthly*
