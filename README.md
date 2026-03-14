# SalonOS / JH Salon Twin

[![CI](https://github.com/Akram0307/jh-salon-twin/actions/workflows/ci.yml/badge.svg)](https://github.com/Akram0307/jh-salon-twin/actions/workflows/ci.yml)
[![CD](https://github.com/Akram0307/jh-salon-twin/actions/workflows/deploy.yml/badge.svg)](https://github.com/Akram0307/jh-salon-twin/actions/workflows/deploy.yml)
[![E2E](https://github.com/Akram0307/jh-salon-twin/actions/workflows/e2e.yml/badge.svg)](https://github.com/Akram0307/jh-salon-twin/actions/workflows/e2e.yml)

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
| Frontend Next | `/frontend-next` | Next.js 14 PWA |
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

### 2. Create release tag

```bash
./scripts/release_after_gcp_success.sh v1.0.0
```

---

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment.

### CI Pipeline (ci.yml)
- **Triggers**: On push to main and pull requests
- **Stages**: Lint, Type Check, Unit Tests, Build
- **Runs on**: Ubuntu latest with Node.js 20

### CD Pipeline (deploy.yml)
- **Triggers**: On push to main (staging) and manual dispatch (production)
- **Stages**: Build Docker images, Push to GCR, Deploy to Cloud Run, Smoke tests
- **Environments**: Staging (auto-deploy) and Production (manual approval)

### E2E Tests (e2e.yml)
- **Triggers**: On push to main, pull requests, and manual dispatch
- **Stages**: Install dependencies, Build frontend/backend, Run Playwright tests
- **Artifacts**: Test results and reports

---

## Deployment

### Staging Environment
- **Auto-deploy**: On push to main
- **URL**: https://salonos-owner-frontend-rgvcleapsa-uc.a.run.app
- **Backend**: https://salonos-backend-rgvcleapsa-uc.a.run.app

### Production Environment
- **Manual deploy**: Via GitHub Actions workflow dispatch
- **URL**: https://salonos-owner-frontend-prod-rgvcleapsa-uc.a.run.app
- **Backend**: https://salonos-backend-prod-rgvcleapsa-uc.a.run.app

---

## Environment Configuration

### Required GitHub Secrets
- `GCP_SA_KEY`: Google Cloud service account key
- `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`: Database credentials
- `SALON_ID`, `GCLOUD_PROJECT`: Project identifiers
- `OPENROUTER_API_KEY`: AI service key
- `TWILIO_*`: Twilio credentials for SMS/WhatsApp
- `REDIS_HOST`, `REDIS_PORT`: Redis configuration
- `INSTANCE_CONNECTION_NAME`: Cloud SQL instance connection

### Environment Variables
- `NEXT_PUBLIC_API_BASE_URL`: Frontend API base URL
- All backend environment variables are set via Cloud Run configuration

---

## Testing Requirements

### Pre-Deploy Checklist
- [ ] `npm run build` passes with 0 errors
- [ ] No TypeScript errors
- [ ] All components use design tokens
- [ ] No inline KPI/Card components
- [ ] Responsive on mobile (375px) and desktop (1440px)

### CI/CD Checks
- [ ] CI runs on every PR and push to main
- [ ] All tests pass before merge allowed
- [ ] Auto-deploy to staging on main merge
- [ ] Manual deploy to production
- [ ] Build artifacts cached for speed
- [ ] Status badges in README

---

## Architecture

### Frontend (Next.js 14)
- **Framework**: Next.js 14 with App Router
- **Styling**: TailwindCSS + Radix UI + shadcn/ui
- **State Management**: Zustand, TanStack Query
- **Design System**: OKLCH color space with three-tier token system

### Backend (Node.js/TypeScript)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Redis caching
- **AI Integration**: Google Vertex AI, Gemini 2.0 Flash, Firebase Genkit
- **Communication**: Twilio for SMS/WhatsApp

### Infrastructure
- **Cloud Provider**: Google Cloud Platform
- **Compute**: Cloud Run (serverless containers)
- **Database**: Cloud SQL (PostgreSQL)
- **Cache**: Redis
- **CI/CD**: GitHub Actions
- **Container Registry**: Google Container Registry (GCR)

---

## Development

### Local Setup
```bash
# Clone repository
git clone https://github.com/Akram0307/jh-salon-twin.git
cd jh-salon-twin

# Install dependencies
cd frontend-next && npm install
cd ../backend && npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development servers
# Frontend (Next.js)
cd frontend-next && npm run dev

# Backend (Node.js)
cd backend && npm run dev
```

### Testing
```bash
# Run unit tests
npm run test

# Run E2E tests
npx playwright test

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

---

## Deployment Scripts

### Manual Deployment
```bash
# Deploy frontend to Cloud Run
./scripts/deploy_frontend_next_cloudrun.sh

# Deploy backend to Cloud Run
./scripts/redeploy_backend_cloudrun.sh
```

### Cloud Build
```bash
# Build and deploy frontend
gcloud builds submit ./frontend-next --config=frontend-next/cloudbuild.yaml

# Build and deploy backend
gcloud builds submit ./backend --tag gcr.io/salon-saas-487508/salonos-backend
```

---

## Monitoring and Logs

### Cloud Run Logs
```bash
# View frontend logs
gcloud run services logs read salonos-owner-frontend --region=us-central1

# View backend logs
gcloud run services logs read salonos-backend --region=us-central1
```

### Health Checks
- Frontend: `https://salonos-owner-frontend-rgvcleapsa-uc.a.run.app/`
- Backend: `https://salonos-backend-rgvcleapsa-uc.a.run.app/health`

---

## Security

### Authentication
- JWT-based authentication for API access
- Role-based access control (Owner, Manager, Staff, Client)
- Secure environment variable management via GitHub Secrets

### Data Protection
- HTTPS everywhere
- Database encryption at rest
- Secure API endpoints with rate limiting
- Input validation and sanitization

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write unit tests for new features
- Update documentation as needed

---

## License

This project is proprietary software. All rights reserved.

---

## Support

For support, please contact the development team or create an issue in the GitHub repository.
