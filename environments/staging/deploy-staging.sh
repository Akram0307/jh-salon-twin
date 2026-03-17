#!/bin/bash
# ============================================================================
# DEPRECATED: This script is a manual fallback for local deployments.
# PRIMARY: Use .github/workflows/deploy.yml for CI/CD deployments.
# This script must be kept in sync with deploy.yml configuration.
# ============================================================================
# SalonOS Staging Environment Deployment Script
# This script deploys both frontend and backend to the staging environment

set -e  # Exit on error

# Configuration
PROJECT_ID="salon-saas-487508"
REGION="us-central1"
FRONTEND_SERVICE="salonos-owner-frontend-staging"
BACKEND_SERVICE="salonos-backend-staging"
GAR_REGISTRY="us-central1-docker.pkg.dev/salon-saas-487508/salonos-images"
STAGING_SA="salonos-staging-sa@salon-saas-487508.iam.gserviceaccount.com"
VPC_CONNECTOR="salonos-staging-vpc"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    log_info "All prerequisites are installed."
}

# Authenticate with Google Cloud
authenticate_gcp() {
    log_info "Authenticating with Google Cloud..."
    
    if [ -z "$GCP_SA_KEY" ]; then
        log_warn "GCP_SA_KEY environment variable is not set. Using default authentication."
        gcloud auth login --update-adc
    else
        echo "$GCP_SA_KEY" > /tmp/gcp-key.json
        gcloud auth activate-service-account --key-file=/tmp/gcp-key.json
        rm /tmp/gcp-key.json
    fi
    
    gcloud config set project $PROJECT_ID
    gcloud config set run/region $REGION
    
    log_info "Authentication successful."
}

# Build and push Docker images
build_and_push() {
    local service_name=$1
    local dockerfile_path=$2
    local image_tag="$GAR_REGISTRY/$service_name:$(git rev-parse --short HEAD)"
    
    log_info "Building $service_name Docker image..."
    
    # Build the Docker image
    docker build -t $image_tag -f $dockerfile_path .
    
    log_info "Pushing $service_name Docker image to registry..."
    docker push $image_tag
    
    echo $image_tag
}

# Deploy to Cloud Run
deploy_to_cloud_run() {
    local service_name=$1
    local image_tag=$2
    local env_file=$3
    
    log_info "Deploying $service_name to Cloud Run..."
    
    # Read environment variables from YAML file
    local env_vars=""
    if [ -f "$env_file" ]; then
        # Simple YAML parsing for environment variables
        env_vars=$(grep -A 100 "^${service_name##*-}:" $env_file | grep -E "^  [A-Z_]+:" | sed 's/^  //' | sed 's/: /=/' | tr '\n' ',')
        env_vars=${env_vars%,}  # Remove trailing comma
    fi
    
    # Deploy to Cloud Run
    gcloud run deploy $service_name \
        --image $image_tag \
        --platform managed \
        --region $REGION \
        --no-allow-unauthenticated \
        --set-env-vars "$env_vars" \
        --service-account salonos-staging-sa@$PROJECT_ID.iam.gserviceaccount.com \
        --memory 1Gi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --vpc-connector=salonos-staging-vpc \
        --vpc-egress=private-ranges-only \
        --timeout=300
    
    log_info "$service_name deployed successfully."
}


# Basic Auth Configuration
BASIC_AUTH_USER="staging"
BASIC_AUTH_PASSWORD="${STAGING_BASIC_AUTH_PASSWORD:-CHANGE_ME_GENERATE_SECURE_PASSWORD}"

# Function to set up basic auth for Cloud Run
setup_basic_auth() {
    local service_name=$1
    log_info "Setting up basic auth for $service_name..."

    # Create a secret for basic auth credentials
    echo -n "$BASIC_AUTH_USER:$BASIC_AUTH_PASSWORD" | gcloud secrets create ${service_name}-basic-auth         --data-file=-         --project=$PROJECT_ID || true

    # Grant access to the service account
    gcloud secrets add-iam-policy-binding ${service_name}-basic-auth         --member=serviceAccount:${service_name}@$PROJECT_ID.iam.gserviceaccount.com         --role=roles/secretmanager.secretAccessor         --project=$PROJECT_ID || true

    # Update the service to use the secret
    gcloud run services update $service_name         --update-secrets=BASIC_AUTH_CREDENTIALS=${service_name}-basic-auth:latest         --region=$REGION         --project=$PROJECT_ID

    log_info "Basic auth configured for $service_name"
}

# Main deployment function
deploy_staging() {
    log_info "Starting staging environment deployment..."
    
    # Check prerequisites
    check_prerequisites
    
    # Authenticate with GCP
    authenticate_gcp
    
# Build and push frontend
    log_info "Deploying frontend to staging..."
    frontend_image=$(build_and_push $FRONTEND_SERVICE "../../frontend-next/Dockerfile")
    deploy_to_cloud_run $FRONTEND_SERVICE $frontend_image "env-staging.yaml"
    setup_basic_auth $FRONTEND_SERVICE

    # Build and push backend
    log_info "Deploying backend to staging..."
    backend_image=$(build_and_push $BACKEND_SERVICE "../../backend/Dockerfile")
    deploy_to_cloud_run $BACKEND_SERVICE $backend_image "env-staging.yaml"
    setup_basic_auth $BACKEND_SERVICE
    
    # Get service URLs
    frontend_url=$(gcloud run services describe $FRONTEND_SERVICE --region $REGION --format 'value(status.url)')
    backend_url=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --format 'value(status.url)')
    
    log_info "Deployment completed successfully!"
    log_info "Frontend URL: $frontend_url"
    log_info "Backend URL: $backend_url"
    
    # Save deployment info
    echo "Frontend: $frontend_url" > deployment-info.txt
    echo "Backend: $backend_url" >> deployment-info.txt
    echo "Deployed at: $(date)" >> deployment-info.txt
    echo "Commit: $(git rev-parse HEAD)" >> deployment-info.txt
}

# Parse command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help, -h     Show this help message"
    echo "  --frontend     Deploy only frontend"
    echo "  --backend      Deploy only backend"
    echo "  --db           Setup database only"
    echo ""
    echo "Examples:"
    echo "  $0              # Deploy both frontend and backend"
    echo "  $0 --frontend   # Deploy only frontend"
    exit 0
fi

# Handle command line arguments
if [ "$1" = "--frontend" ]; then
    check_prerequisites
    authenticate_gcp
    frontend_image=$(build_and_push $FRONTEND_SERVICE "../../frontend-next/Dockerfile")
    deploy_to_cloud_run $FRONTEND_SERVICE $frontend_image "env-staging.yaml"
elif [ "$1" = "--backend" ]; then
    check_prerequisites
    authenticate_gcp
    backend_image=$(build_and_push $BACKEND_SERVICE "../../backend/Dockerfile")
    deploy_to_cloud_run $BACKEND_SERVICE $backend_image "env-staging.yaml"
elif [ "$1" = "--db" ]; then
    log_info "Setting up staging database..."
    # This would typically connect to Cloud SQL and run the SQL script
    log_warn "Database setup requires Cloud SQL connection. Please run manually or configure Cloud SQL proxy."
    log_info "SQL script is available at: database-staging.sql"
else
    # Default: deploy everything
    deploy_staging
fi
