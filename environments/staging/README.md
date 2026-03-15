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
