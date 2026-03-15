#!/bin/bash
# Deploy alerting policies to Google Cloud Monitoring
# Run this script after the backend is deployed and custom metrics are available

set -e

PROJECT_ID="salon-saas-487508"
ALERTS_DIR="$(dirname "$0")/alerts"

echo "Deploying alerting policies to Google Cloud Monitoring..."
echo "Project: $PROJECT_ID"
echo ""

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "Error: No active gcloud account. Run 'gcloud auth login' first."
    exit 1
fi

# Deploy each alert policy
for policy_file in "$ALERTS_DIR"/*.json; do
    policy_name=$(basename "$policy_file" .json)
    echo "Deploying $policy_name..."

    if gcloud alpha monitoring policies create         --project="$PROJECT_ID"         --policy-from-file="$policy_file" 2>&1; then
        echo "✓ Successfully deployed $policy_name"
    else
        echo "✗ Failed to deploy $policy_name (metrics may not be available yet)"
    fi
    echo ""
done

echo "Alert deployment complete!"
echo "View alerts: https://console.cloud.google.com/monitoring/alerting/policies?project=$PROJECT_ID"
