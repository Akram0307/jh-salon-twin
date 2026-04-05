# SalonOS Performance Monitoring Setup

## Overview
This directory contains the performance monitoring configuration for SalonOS, including dashboards and alerting policies for Google Cloud Monitoring.

## Dashboard

### Performance Dashboard
- **Dashboard ID**: 8ffaa5d8-dacf-451d-a569-18a16d7ffdd6
- **Console URL**: https://console.cloud.google.com/monitoring/dashboards/8ffaa5d8-dacf-451d-a569-18a16d7ffdd6?project=salon-saas-487508

### Dashboard Widgets
1. **API Response Time (p95)** - Tracks 95th percentile response time
2. **Request Throughput (req/min)** - Monitors request rate
3. **Memory Usage** - Tracks memory utilization percentage
4. **CPU Usage** - Monitors CPU utilization percentage
5. **Error Rate (5xx)** - Tracks server error rate
6. **Database Query Time (p95)** - Monitors database performance

## Alerting Policies

### Prerequisites
Alert policies require custom metrics to be populated by the backend application. Deploy the backend first, then run the alert deployment script.

### Alert Policies
1. **High API Response Time** - Triggers when p95 > 5000ms for 5 minutes
2. **High Memory Usage** - Triggers when memory > 90% for 5 minutes
3. **High CPU Usage** - Triggers when CPU > 90% for 5 minutes
4. **High Error Rate** - Triggers when errors > 10/min for 1 minute

### Deploying Alert Policies
```bash
# Deploy all alert policies
./deploy-alerts.sh
```

## Custom Metrics

The backend application pushes the following custom metrics:
- `custom.googleapis.com/api/response_time_p95`
- `custom.googleapis.com/api/request_count`
- `custom.googleapis.com/api/error_count`
- `custom.googleapis.com/memory/usage_percent`
- `custom.googleapis.com/cpu/usage_percent`

## Files
- `performance-dashboard.json` - Dashboard configuration
- `alerts/` - Alert policy configurations
- `deploy-alerts.sh` - Script to deploy alert policies
- `README.md` - This file

## Troubleshooting

### Metrics Not Appearing
If metrics don't appear in the dashboard:
1. Verify backend is deployed and running
2. Check backend logs for monitoring middleware
3. Wait 10-15 minutes for metrics to propagate

### Alert Policies Not Deploying
If alert deployment fails:
1. Ensure backend has been running for at least 10 minutes
2. Verify custom metrics exist in Cloud Monitoring
3. Check IAM permissions for monitoring policies

---

## CI/CD IAM Requirements

### Workload Identity Federation (Recommended)
For GitHub Actions to authenticate with GCP without storing service account keys:

1. **Create Workload Identity Pool:**
   ```bash
   gcloud iam workload-identity-pools create gh-actions-pool --location=global --display-name="GitHub Actions"
   ```

2. **Create Provider:**
   ```bash
   gcloud iam workload-identity-pools providers create gh-provider --location=global      --workload-identity-pool=gh-actions-pool --display-name="GitHub Provider"      --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository"      --attribute-condition="attribute.repository == "Akram0307/jh-salon-twin""
   ```

3. **Create Service Account:**
   ```bash
   gcloud iam service-accounts create salonos-staging-deployer --display-name="SalonOS Staging Deployer"
   ```

4. **Grant Required Roles:**
   ```bash
   PROJECT_ID="salon-saas-487508"
   SA="salonos-staging-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
   gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role="roles/run.admin"
   gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role="roles/run.invoker"
   gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role="roles/artifactregistry.writer"
   gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role="roles/cloudsql.client"
   gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"
   gcloud iam service-accounts add-iam-policy-binding $SA --member="serviceAccount:$SA" --role="roles/iam.serviceAccountUser"
   ```

5. **Bind SA to Pool:**
   ```bash
   gcloud iam service-accounts add-iam-policy-binding $SA      --role="roles/iam.workloadIdentityUser"      --member="principalSet://iam.googleapis.com/projects/${PROJECT_ID}/locations/global/workloadIdentityPools/gh-actions-pool/attribute.repository/Akram0307/jh-salon-twin"
   ```

### Smoke Test Approach
The e2e.yml smoke test job uses `gcloud auth print-identity-token` which requires:
- Workload Identity Federation configured (above)
- Service account with `roles/run.invoker`
- Cloud Run service with ingress allowing internal traffic

**Fallback (if WIF not available):** Replace identity-token auth with HTTP health check:
```yaml
- name: Smoke test
  run: |
    STATUS=$(curl -sf -o /dev/null -w "%{http_code}" https://staging-salonos-xxxxx-uc.a.run.app/api/health/ready)
    if [ "$STATUS" != "200" ]; then
      echo "Health check failed with status $STATUS"
      exit 1
    fi
```

### Required GitHub Secrets
| Secret | Description | Required |
|--------|-------------|----------|
| `GCP_PROJECT_ID` | GCP project ID | Yes |
| `GCP_SA_KEY` | Service account key JSON (if not using WIF) | Conditional |
| `GAR_REGISTRY` | Artifact Registry path | Yes |
| `STAGING_SERVICE_NAME` | Cloud Run service name | Yes |
| `STAGING_REGION` | GCP region | Yes |