#!/bin/bash
set -e

cd /a0/usr/projects/jh_salon_twin

echo "Authenticating with GCP..."
gcloud auth activate-service-account --key-file=credentials/gcp_key.json
gcloud config set project salon-saas-487508
export GOOGLE_APPLICATION_CREDENTIALS="/a0/usr/projects/jh_salon_twin/credentials/gcp_key.json"

echo "Setting postgres user password..."
gcloud sql users set-password postgres --instance=salon-booking-db --password=JHSalonAdmin123!

echo "Applying schema to Cloud SQL..."
PGPASSWORD="JHSalonAdmin123!" gcloud sql connect salon-booking-db --user=postgres --quiet < db/schema.sql

echo "Scaffolding frontend non-interactively..."
rm -rf frontend
npx --yes create-vite@5 frontend --template react-ts

echo "Installing frontend dependencies..."
cd frontend
npm install
npm install tailwindcss @tailwindcss/vite firebase react-router-dom

echo "Setup Complete!"
