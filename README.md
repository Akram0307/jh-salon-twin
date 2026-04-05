# SalonOS - AI-Native Salon Revenue Operating System

[![CI](https://github.com/Akram0307/jh-salon-twin/actions/workflows/ci.yml/badge.svg)](https://github.com/Akram0307/jh-salon-twin/actions/workflows/ci.yml)
[![CD](https://github.com/Akram0307/jh-salon-twin/actions/workflows/deploy.yml/badge.svg)](https://github.com/Akram0307/jh-salon-twin/actions/workflows/deploy.yml)
[![E2E](https://github.com/Akram0307/jh-salon-twin/actions/workflows/e2e.yml/badge.svg)](https://github.com/Akram0307/jh-salon-twin/actions/workflows/e2e.yml)

> **Production-Ready** AI-native salon management platform serving owners, staff, and clients through an intelligent revenue operating system.

---

## 📋 Executive Summary

**SalonOS** is a comprehensive salon revenue operating system designed to automate and optimize salon operations through AI-powered insights. The platform provides three distinct interfaces:

| Interface | Target User | Technology | Purpose |
|-----------|-------------|------------|----------|
| **Owner HQ** | Salon Owners/Managers | Next.js 14 + PWA | Control tower for operations, analytics, POS |
| **Staff Workspace** | Salon Staff | Vite + React | Scheduling, task management, client check-in |
| **Client PWA** | Salon Clients | Vite + React | Appointment booking, AI concierge, waitlist |

**Key Statistics:**
- **50** API route files
- **66** backend service files
- **25** data repository files
- **117** frontend React components
- **16** frontend pages
- **13** E2E test specs
- **30+** database tables

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GOOGLE CLOUD PLATFORM                           │
│                           Project: salon-saas-487508                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        CLOUD RUN SERVICES                           │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │                                                                       │   │
│   │   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────┐ │   │
│   │   │  Owner Frontend   │    │   Client PWA     │    │ Staff WS    │ │   │
│   │   │  (Next.js 14)    │    │   (Vite/React)   │    │ (Vite)      │ │   │
│   │   │                  │    │                  │    │              │ │   │
│   │   │ • Dashboard      │    │ • Booking Flow   │    │ • Schedule   │ │   │
│   │   │ • Analytics      │    │ • AI Concierge   │    │ • Tasks      │ │   │
│   │   │ • POS            │    │ • Waitlist       │    │ • Clients    │ │   │
│   │   │ • Staff Mgmt     │    │ • Notifications   │    │ • Earnings   │ │   │
│   │   └────────┬─────────┘    └────────┬─────────┘    └──────┬───────┘ │   │
│   │            │                       │                    │         │   │
│   │            └───────────────────────┼────────────────────┘         │   │
│   │                                    │                                │   │
│   │                           ┌────────▼────────┐                      │   │
│   │                           │   Backend API   │                      │   │
│   │                           │   (Express.js)  │                      │   │
│   │                           │                 │                      │   │
│   │                           │ • REST API      │                      │   │
│   │                           │ • WebSocket     │                      │   │
│   │                           │ • AI Services   │                      │   │
│   │                           │ • Twilio Webhooks│                      │   │
│   │                           └────────┬────────┘                      │   │
│   │                                    │                               │   │
│   └────────────────────────────────────┼───────────────────────────────┘   │
│                                        │                                   │
│   ┌────────────────────────────────────┼───────────────────────────────┐   │
│   │                         DATA LAYER                                   │   │
│   │                                                                    │   │
│   │   ┌─────────────┐         ┌─────────────┐        ┌─────────────┐    │   │
│   │   │ Cloud SQL   │◄───────│    Redis   │◄───────│ GCP Secret │    │   │
│   │   │ PostgreSQL  │         │   Cache    │        │  Manager   │    │   │
│   │   │             │         │            │        │            │    │   │
│   │   │ • Clients   │         │ • Sessions │        │ • JWT Keys │    │   │
│   │   │ • Appointments│       │ • Rate Limit│       │ • DB Pass  │    │   │
│   │   │ • Staff     │         │ • WebSocket │       │ • API Keys │    │   │
│   │   │ • Services  │         │ • AI State │        │            │    │   │
│   │   │ • Revenue   │         │            │        │            │    │   │
│   │   └─────────────┘         └────────────┘        └─────────────┘    │   │
│   │                                                                    │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      EXTERNAL SERVICES                               │   │
│   │                                                                    │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐   │   │
│   │   │  OpenRouter  │  │   Twilio     │  │   Google Vertex AI    │   │   │
│   │   │  (AI/Gemini) │  │ (SMS/WhatsApp)│  │   (Gemini 2.0 Flash) │   │   │
│   │   └──────────────┘  └──────────────┘  └────────────────────────┘   │   │
│   │                                                                    │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Application Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION FLOWS                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  OWNER FLOW:                                                             │
│  ┌────────┐    ┌────────────┐    ┌─────────────┐    ┌────────────────┐ │
│  │ Login  │───►│ Dashboard  │───►│ Analytics   │───►│ POS/Revenue    │ │
│  │ (JWT)  │    │ (KPIs)     │    │ (Reports)   │    │ (Transactions)│ │
│  └────────┘    └─────┬──────┘    └──────┬──────┘    └────────────────┘ │
│                     │                    │                              │
│                     ▼                    ▼                              │
│              ┌────────────┐        ┌─────────────┐                       │
│              │ Schedule   │        │ Staff Mgmt  │                       │
│              │ (Drag-Drop) │        │ (Profiles)  │                       │
│              └────────────┘        └─────────────┘                       │
│                                                                          │
│  CLIENT FLOW:                                                            │
│  ┌────────┐    ┌────────────┐    ┌─────────────┐    ┌────────────────┐ │
│  │ Open  │───►│ AI Cvncierge│───►│ Select      │───►│ Confirm        │ │
│  │ PWA   │    │ (Gemini)    │    │ Service/Time│    │ Booking        │ │
│  └────────┘    └────────────┘    └─────────────┘    └────────────────┘ │
│                                                                          │
│  AI AUTOMATION FLOW:                                                     │
│  ┌────────────┐    ┌─────────────┐    ┌──────────────┐                  │
│  │ Demand     │───►│ Slot         │───►│ Waitlist     │                  │
│  │ Forecasting│    │ Suggestion   │    │ Recovery     │                  │
│  └────────────┘    └─────────────┘    └──────────────┘                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
jh-salon-twin/
├── backend/                          # Express.js API Server (Node.js/TypeScript)
│   ├── src/
│   │   ├── routes/                   # 50 API route files
│   │   │   ├── authRoutes.ts         # Authentication (login, register, refresh)
│   │   │   ├── appointmentRoutes.ts  # Appointment CRUD + check-in
│   │   │   ├── clientRoutes.ts       # Client management
│   │   │   ├── staffRoutes.ts        # Staff management
│   │   │   ├── serviceRoutes.ts      # Salon services
│   │   │   ├── paymentRoutes.ts      # Payment processing
│   │   │   ├── posRoutes.ts          # Point-of-sale operations
│   │   │   ├── analyticsRoutes.ts   # Revenue & business analytics
│   │   │   ├── aiRoutes.ts          # AI service endpoints
│   │   │   ├── notificationRoutes.ts # Push notifications
│   │   │   ├── waitlistRoutes.ts    # Waitlist management
│   │   │   ├── feedbackRoutes.ts    # Client feedback
│   │   │   ├── healthRoutes.ts      # Health checks
│   │   │   └── [38 more routes]...
│   │   │
│   │   ├── services/                 # 66 business logic services
│   │   │   ├── AIService.ts          # AI orchestration
│   │   │   ├── AIConciergeBookingService.ts  # AI booking assistant
│   │   │   ├── BookingOrchestrator.ts        # Booking workflow
│   │   │   ├── DemandForecastService.ts      # Demand prediction
│   │   │   ├── RevenueBrain.ts                # Revenue intelligence
│   │   │   ├── WaitlistService.ts            # Waitlist management
│   │   │   ├── NotificationOrchestrator.ts   # Multi-channel notifications
│   │   │   ├── TwilioWhatsAppService.ts      # WhatsApp integration
│   │   │   ├── SMSNotificationService.ts     # SMS via Twilio
│   │   │   ├── SlotSuggestionService.ts      # AI slot recommendations
│   │   │   ├── SmartUpsellEngine.ts          # Upsell automation
│   │   │   ├── PaymentRecordingService.ts    # Transaction recording
│   │   │   └── [55 more services]...
│   │   │
│   │   ├── repositories/             # 25 data access layer
│   │   │   ├── ClientRepository.ts
│   │   │   ├── AppointmentRepository.ts
│   │   │   ├── StaffRepository.ts
│   │   │   ├── ServiceRepository.ts
│   │   │   ├── TransactionRepository.ts
│   │   │   ├── WaitlistRepository.ts
│   │   │   └── [19 more repositories]...
│   │   │
│   │   ├── schemas/                  # Zod validation schemas
│   │   │   ├── appointmentSchemas.ts
│   │   │   ├── clientSchemas.ts
│   │   │   ├── authSchemas.ts
│   │   │   └── [22 more schemas]...
│   │   │
│   │   ├── middleware/               # Express middleware
│   │   │   ├── auth.ts              # JWT authentication
│   │   │   ├── rateLimiter.ts       # Rate limiting
│   │   │   ├── errorHandler.ts      # Error handling
│   │   │   └── [5 more middlewares]...
│   │   │
│   │   ├── agents/                   # AI agent implementations
│   │   │   ├── RevenueAgent.ts      # Revenue optimization agent
│   │   │   ├── BookingAgent.ts       # Booking assistant agent
│   │   │   └── ConciergeAgent.ts    # Client concierge agent
│   │   │
│   │   ├── config/                   # Configuration
│   │   │   ├── secrets.ts           # GCP Secret Manager integration
│   │   │   ├── database.ts          # PostgreSQL connection
│   │   │   └── [7 more configs]...
│   │   │
│   │   ├── webhooks/                 # Twilio webhook handlers
│   │   │   └── twilioWebhook.ts
│   │   │
│   │   ├── utils/                    # Utilities
│   │   │   ├── logger.ts            # Winston logging
│   │   │   └── validators.ts
│   │   │
│   │   ├── types/                    # TypeScript type definitions
│   │   │   ├── index.ts
│   │   │   ├── appointment.ts
│   │   │   └── [2 more type files]...
│   │   │
│   │   ├── __tests__/                # Unit tests (~82% coverage)
│   │   │   ├── services/
│   │   │   ├── routes/
│   │   │   └── repositories/
│   │   │
│   │   ├── __mocks__/                # Test mocks
│   │   └── index.ts                  # App entry point
│   │
│   ├── scripts/                       # Maintenance scripts
│   │   ├── seed_demo_production.js   # Database seeding
│   │   ├── verify_staff_availability.js
│   │   ├── test_tcp_handshake.js
│   │   └── twilioTemplateEngine.ts
│   │
│   ├── db/                           # Database migrations (dbmate)
│   │   └── migrations/
│   │
│   ├── Dockerfile                    # Container build
│   ├── Dockerfile.deploy
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts              # Test configuration
│   └── dbmate.json                   # Migration config
│
├── frontend-next/                    # Owner HQ (Next.js 14 PWA)
│   ├── src/
│   │   ├── app/                      # App Router pages
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   ├── owner/
│   │   │   │   ├── dashboard/       # KPI dashboard
│   │   │   │   ├── schedule/        # Drag-drop calendar
│   │   │   │   ├── clients/         # Client management
│   │   │   │   ├── staff/          # Staff management
│   │   │   │   ├── services/       # Service catalog
│   │   │   │   ├── pos/            # Point-of-sale
│   │   │   │   ├── reports/        # Analytics reports
│   │   │   │   ├── settings/      # Salon settings
│   │   │   │   └── page.tsx        # Owner root redirect
│   │   │   ├── staff/
│   │   │   │   ├── schedule/       # Staff schedule view
│   │   │   │   ├── availability/   # Availability settings
│   │   │   │   ├── earnings/       # Earnings view
│   │   │   │   └── page.tsx
│   │   │   ├── client/
│   │   │   │   └── chat/           # AI concierge chat
│   │   │   ├── onboarding/         # First-time setup
│   │   │   └── page.tsx            # Root redirect
│   │   │
│   │   ├── components/               # 117 React components
│   │   │   ├── ui/                 # Base UI (Radix + shadcn/ui)
│   │   │   ├── dashboard/          # Dashboard widgets
│   │   │   ├── scheduling/         # Calendar components
│   │   │   ├── pos/                # POS components
│   │   │   └── [organized by feature]...
│   │   │
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useApi.ts
│   │   │   ├── useAppointments.ts
│   │   │   └── [15 more hooks]...
│   │   │
│   │   ├── lib/                     # Utilities
│   │   │   ├── api.ts              # API client
│   │   │   ├── utils.ts            # Helpers
│   │   │   └── constants.ts
│   │   │
│   │   ├── store/                   # Zustand state management
│   │   │   ├── authStore.ts
│   │   │   ├── appointmentStore.ts
│   │   │   └── [5 more stores]...
│   │   │
│   │   └── types/                   # TypeScript definitions
│   │
│   ├── public/                      # Static assets
│   ├── cloudbuild.yaml             # GCP Cloud Build config
│   ├── Dockerfile
│   ├── next.config.js              # Next.js configuration
│   ├── tailwind.config.js         # TailwindCSS with OKLCH
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # Staff Workspace + Client PWA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/                 # Vite route pages
│   │   ├── staff/                # Staff workspace features
│   │   │   ├── schedule/
│   │   │   ├── tasks/
│   │   │   └── clients/
│   │   └── client/               # Client PWA features
│   │       ├── booking/
│   │       ├── waitlist/
│   │       └── chat/
│   ├── public/
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── package.json
│
├── e2e/                            # Playwright E2E Test Suite
│   ├── tests/
│   │   ├── login.spec.ts          # Authentication flow
│   │   ├── dashboard.spec.ts      # Dashboard functionality
│   │   ├── booking.spec.ts        # Client booking flow
│   │   ├── pos.spec.ts            # POS operations
│   │   ├── pos-payment.spec.ts    # Payment processing
│   │   ├── drag-drop-scheduling.spec.ts  # Schedule management
│   │   ├── bulk-operations.spec.ts       # Bulk client operations
│   │   ├── command-palette.spec.ts       # Quick actions
│   │   ├── visual-comparison.spec.ts     # Visual regression
│   │   ├── mobile/
│   │   └── sprint3/
│   ├── helpers/                   # Test utilities
│   ├── mocks/                     # API mocking
│   ├── screenshots/              # Visual baselines
│   │   ├── baseline/
│   │   ├── current/
│   │   └── diff/
│   ├── playwright.config.ts
│   └── global-setup.ts
│
├── db/                             # Database Schema & Migrations
│   ├── migrations/               # dbmate SQL migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_appointments.sql
│   │   ├── 003_transactions.sql
│   │   └── [...more migrations]
│   └── schema.sql                 # Full schema reference
│
├── .github/
│   └── workflows/                 # 12 GitHub Actions workflows
│       ├── ci.yml                # CI pipeline
│       ├── deploy.yml            # Full deploy
│       ├── e2e.yml               # E2E tests
│       ├── codeql.yml             # Security analysis
│       ├── lighthouse.yml         # Performance
│       ├── visual-regression.yml  # Visual tests
│       ├── deploy-backend.yml     # Backend only
│       ├── deploy-client-pwa.yml  # Client PWA
│       ├── deploy-infra.yml       # Infrastructure
│       ├── monitor.yml            # Health monitoring
│       ├── security-scan.yml      # Vulnerability scan
│       └── dependency-update.yml  # Dependabot
│
├── scripts/                       # Deployment & Maintenance
│   ├── redeploy_backend_cloudrun.sh
│   ├── deploy_frontend_next_cloudrun.sh
│   ├── git_sync_after_gcp_success.sh
│   ├── release_after_gcp_success.sh
│   ├── daily_backup.sh
│   ├── security-audit.sh
│   └── verify_backups.sh
│
├── docs/                          # Documentation
│   ├── disaster-recovery-runbook.md
│   ├── backend_api_integration_guide.md
│   ├── owner_hq_page_specifications.md
│   └── [10 more docs]
│
└── skills/                        # Agent Zero Skills
    ├── vision_analyzer/
    ├── find-skills/
    └── [2 more skills]
```

---

## 🗄️ Database Schema

### Core Tables

```sql
-- Salon Configuration
CREATE TABLE salon_config (
    salon_id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Salon Capacity & Rooms
CREATE TABLE salon_capacity (
    id UUID PRIMARY KEY,
    salon_id UUID REFERENCES salon_config,
    service_room_category VARCHAR(100),
    max_concurrent_appointments INTEGER,
    operating_hours JSONB
);

-- Services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES salon_config,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Staff
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES salon_config,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'stylist',
    is_active BOOLEAN DEFAULT true,
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Staff Availability
CREATE TABLE staff_availability (
    id UUID PRIMARY KEY,
    staff_id UUID REFERENCES staff,
    day_of_week INTEGER, -- 0=Sunday, 6=Saturday
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN
);

-- Clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES salon_config,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(50),
    beauty_profile JSONB,
    preferences JSONB,
    total_visits INTEGER DEFAULT 0,
    last_visit TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES salon_config,
    client_id UUID REFERENCES clients,
    staff_id UUID REFERENCES staff,
    appointment_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    qr_token VARCHAR(255) UNIQUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Appointment Services (many-to-many)
CREATE TABLE appointment_services (
    id UUID PRIMARY KEY,
    appointment_id UUID REFERENCES appointments,
    service_id UUID REFERENCES services,
    staff_id UUID REFERENCES staff,
    duration_minutes INTEGER,
    price DECIMAL(10,2)
);

-- Transactions & Revenue
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES salon_config,
    appointment_id UUID REFERENCES appointments,
    client_id UUID REFERENCES clients,
    staff_id UUID REFERENCES staff,
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'completed',
    transaction_time TIMESTAMP DEFAULT NOW()
);

-- Transaction Items
CREATE TABLE transaction_items (
    id UUID PRIMARY KEY,
    transaction_id UUID REFERENCES transactions,
    service_id UUID REFERENCES services,
    description VARCHAR(255),
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2)
);

-- Owners
CREATE TABLE owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES salon_config,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Salon Settings
CREATE TABLE salon_settings (
    id UUID PRIMARY KEY,
    salon_id UUID REFERENCES salon_config,
    notifications JSONB,
    business_hours JSONB,
    booking_rules JSONB,
    ai_config JSONB
);

-- Waitlist
CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES salon_config,
    client_id UUID REFERENCES clients,
    preferred_date DATE,
    preferred_time VARCHAR(20),
    service_id UUID REFERENCES services,
    status VARCHAR(50) DEFAULT 'waiting',
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    salon_id UUID REFERENCES salon_config,
    client_id UUID REFERENCES clients,
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    channel VARCHAR(20) -- push, sms, whatsapp
);

-- Feedback
CREATE TABLE feedback (
    id UUID PRIMARY KEY,
    salon_id UUID REFERENCES salon_config,
    client_id UUID REFERENCES clients,
    appointment_id UUID REFERENCES appointments,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Action History (Audit Log)
CREATE TABLE action_history (
    id UUID PRIMARY KEY,
    salon_id UUID REFERENCES salon_config,
    user_id UUID,
    user_type VARCHAR(50),
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- AI Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    salon_id UUID REFERENCES salon_config,
    client_id UUID REFERENCES clients,
    context JSONB,
    messages JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- SMS/WhatsApp Templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY,
    salon_id UUID REFERENCES salon_config,
    type VARCHAR(50),
    channel VARCHAR(20),
    template_name VARCHAR(100),
    content TEXT,
    variables JSONB
);

-- Indexes
CREATE INDEX idx_appointments_time ON appointments(appointment_time);
CREATE INDEX idx_appointments_salon ON appointments(salon_id);
CREATE INDEX idx_appointments_staff ON appointments(staff_id);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_qr ON appointments(qr_token);
CREATE INDEX idx_clients_phone ON clients(phone_number);
CREATE INDEX idx_clients_salon ON clients(salon_id);
CREATE INDEX idx_transaction_items_apt_id ON appointment_services(appointment_id);
CREATE INDEX idx_waitlist_salon ON waitlist(salon_id);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_notifications_client ON notifications(client_id);
CREATE INDEX idx_feedback_appointment ON feedback(appointment_id);
```

---

## 🌐 API Reference

### Base URLs

| Environment | Backend API | Frontend |
|-------------|-------------|----------|
| **Production** | `https://salonos-backend-prod-*.a.run.app` | `https://salonos-owner-frontend-prod-*.a.run.app` |
| **Staging** | `https://salonos-backend-*.a.run.app` | `https://salonos-owner-frontend-*.a.run.app` |
| **Local Dev** | `http://localhost:3000` | `http://localhost:5173` |

### Authentication

All protected endpoints require JWT token:
```
Authorization: Bearer <access_token>
```

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new owner |
| POST | `/api/auth/login` | Login, returns access + refresh tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate refresh token |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/password` | Change password |

### Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List appointments (filterable) |
| POST | `/api/appointments` | Create appointment |
| GET | `/api/appointments/:id` | Get appointment details |
| PUT | `/api/appointments/:id` | Update appointment |
| DELETE | `/api/appointments/:id` | Cancel appointment |
| POST | `/api/appointments/:id/check-in` | Staff check-in |
| POST | `/api/appointments/:id/complete` | Mark complete |
| GET | `/api/appointments/qr/:token` | Lookup by QR token |

### Clients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | List all clients |
| POST | `/api/clients` | Create client |
| GET | `/api/clients/:id` | Get client details |
| PUT | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Delete client |
| GET | `/api/clients/:id/history` | Client appointment history |
| GET | `/api/clients/:id/beauty-profile` | Get beauty profile |
| PUT | `/api/clients/:id/beauty-profile` | Update beauty profile |
| POST | `/api/clients/bulk` | Bulk create/update clients |

### Staff

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/staff` | List staff members |
| POST | `/api/staff` | Add staff member |
| GET | `/api/staff/:id` | Get staff profile |
| PUT | `/api/staff/:id` | Update staff |
| DELETE | `/api/staff/:id` | Remove staff |
| GET | `/api/staff/:id/schedule` | Staff schedule |
| PUT | `/api/staff/:id/availability` | Set availability |
| GET | `/api/staff/:id/earnings` | Staff earnings report |

### Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List services |
| POST | `/api/services` | Create service |
| GET | `/api/services/:id` | Get service details |
| PUT | `/api/services/:id` | Update service |
| DELETE | `/api/services/:id` | Delete service |

### POS & Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pos/create-session` | Start POS session |
| POST | `/api/pos/add-item` | Add item to transaction |
| POST | `/api/pos/complete` | Complete transaction |
| POST | `/api/pos/void/:id` | Void transaction |
| GET | `/api/transactions` | List transactions |
| GET | `/api/transactions/:id` | Transaction details |
| POST | `/api/payments/process` | Process payment |
| GET | `/api/payments/:id/status` | Payment status |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/revenue` | Revenue analytics |
| GET | `/api/analytics/appointments` | Appointment metrics |
| GET | `/api/analytics/clients` | Client metrics |
| GET | `/api/analytics/staff` | Staff performance |
| GET | `/api/analytics/demand` | Demand forecasting |
| GET | `/api/analytics/reports/daily` | Daily report |
| GET | `/api/analytics/reports/weekly` | Weekly report |
| GET | `/api/analytics/reports/monthly` | Monthly report |

### AI Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | AI chat assistant |
| POST | `/api/ai/concierge` | Booking concierge |
| POST | `/api/ai/demand-forecast` | Demand prediction |
| POST | `/api/ai/revenue-insights` | Revenue insights |
| POST | `/api/ai/recommendations` | Service recommendations |
| POST | `/ai/waitlist/recovery` | Waitlist recovery |

### Waitlist

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/waitlist` | Get waitlist |
| POST | `/api/waitlist` | Add to waitlist |
| PUT | `/api/waitlist/:id` | Update entry |
| DELETE | `/api/waitlist/:id` | Remove from waitlist |
| POST | `/api/waitlist/:id/offer` | Offer slot to client |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| POST | `/api/notifications/send` | Send notification |
| POST | `/api/notifications/bulk` | Bulk send |
| PUT | `/api/notifications/:id/read` | Mark as read |
| POST | `/api/notifications/templates` | Create template |

### Schedule

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schedule/slots` | Available time slots |
| POST | `/api/schedule/suggest` | AI slot suggestions |
| GET | `/api/schedule/rules` | Schedule rules |
| POST | `/api/schedule/rules` | Create rule |
| PUT | `/api/schedule/rules/:id` | Update rule |

### Feedback

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feedback` | List feedback |
| POST | `/api/feedback` | Submit feedback |
| GET | `/api/feedback/analytics` | Feedback analytics |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhooks/twilio/sms` | Twilio SMS callback |
| POST | `/webhooks/twilio/whatsapp` | WhatsApp callback |
| POST | `/webhooks/twilio/status` | Delivery status |

### Health Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/api/health` | Detailed health (DB + Redis) |
| GET | `/api/diagnostics` | System diagnostics |

---

## 🤖 AI Services Architecture

### AI Concierge (Client-Facing)

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI CONCIERGE SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Client Message ──► Intent Router ──► Conversation Manager        │
│                           │                    │                │
│                           ▼                    ▼                │
│                   ┌────────────────┐    ┌─────────────────┐   │
│                   │ AIConcierge    │    │ Conversation    │   │
│                   │ BookingService │    │ ContextStore   │   │
│                   └───────┬────────┘    └─────────────────┘   │
│                           │                                   │
│                           ▼                                   │
│                   ┌────────────────┐                          │
│                   │ Gemini 2.0     │                          │
│                   │ via OpenRouter │                          │
│                   └────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### AI Revenue Intelligence

```
┌─────────────────────────────────────────────────────────────────┐
│                    REVENUE AI SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ Demand       │───►│ Revenue      │───►│ Slot Suggestion  │   │
│  │ Forecast     │    │ Brain        │    │ Engine           │   │
│  └──────────────┘    └──────────────┘    └──────────────────┘   │
│         │                  │                    │               │
│         ▼                  ▼                    ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ Gap Fill     │    │ Smart        │    │ Waitlist         │   │
│  │ Optimizer    │    │ Upsell       │    │ Recovery         │   │
│  └──────────────┘    └──────────────┘    └──────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### AI Services List

| Service | Purpose |
|---------|----------|
| `AIService.ts` | Main AI orchestration |
| `AIConciergeBookingService.ts` | Handles booking conversations |
| `AIRevenueBrain.ts` | Revenue optimization decisions |
| `DemandForecastService.ts` | Predicts appointment demand |
| `DemandPredictionService.ts` | ML-based predictions |
| `DemandLearningService.ts` | Learns from historical patterns |
| `SlotSuggestionService.ts` | AI-powered slot recommendations |
| `SmartUpsellEngine.ts` | Upsell opportunity detection |
| `SmartDiscountOptimizer.ts` | Discount optimization |
| `WaitlistRecoveryOrchestrator.ts` | Waitlist conversion |
| `ConversationManager.ts` | Chat conversation state |
| `ConversationContextStore.ts` | AI conversation memory |
| `IntentRouter.ts` | Routes user intents |
| `RichMediaFormatter.ts` | Formats AI responses |
| `PWAConciergeService.ts` | PWA-specific AI features |

---

## 📊 Frontend Pages

### Owner HQ (Next.js 14)

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Owner authentication |
| Dashboard | `/owner/dashboard` | KPI overview, revenue today, upcoming appointments |
| Schedule | `/owner/schedule` | Drag-drop calendar, appointment management |
| Clients | `/owner/clients` | Client list, profiles, history |
| Staff | `/owner/staff` | Staff management, profiles |
| Services | `/owner/services` | Service catalog management |
| POS | `/owner/pos` | Point-of-sale, transactions |
| Reports | `/owner/reports` | Analytics, revenue reports |
| Settings | `/owner/settings` | Salon configuration |
| Onboarding | `/onboarding` | Initial salon setup |

### Staff Workspace (Next.js 14)

| Page | Route | Description |
|------|-------|-------------|
| Schedule | `/staff/schedule` | Personal schedule view |
| Availability | `/staff/availability` | Set working hours |
| Earnings | `/staff/earnings` | Personal earnings report |

### Client PWA (Vite/React)

| Page | Route | Description |
|------|-------|-------------|
| Chat | `/client/chat` | AI concierge conversation |

---

## 🚀 Deployment

### Deployment Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT PIPELINE                             │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐                                                       │
│  │ Push to main │                                                       │
│  └──────┬───────┘                                                       │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         CI PIPELINE                              │   │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌────────────────────┐  │   │
│  │  │  Lint  │─►│ TypeCheck │─►│  Build  │─►│   Unit Tests       │  │   │
│  │  └─────────┘  └──────────┘  └─────────┘  └────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         CD PIPELINE                              │   │
│  │                                                                  │   │
│  │  ┌────────────┐    ┌───────────┐    ┌────────────────────────┐ │   │
│  │  │  Build     │───►│ Push to   │───►│  Deploy to Cloud Run   │ │   │
│  │  │  Docker    │    │   GCR     │    │  (Staging - Auto)      │ │   │
│  │  └────────────┘    └───────────┘    └────────────────────────┘ │   │
│  │                                              │                  │   │
│  │                                              ▼                  │   │
│  │                              ┌────────────────────────┐        │   │
│  │                              │   Smoke Tests         │        │   │
│  │                              │   (Playwright)        │        │   │
│  │                              └────────────────────────┘        │   │
│  │                                              │                  │   │
│  │                                    ┌────────┴────────┐        │   │
│  │                                    ▼                 ▼        │   │
│  │                             ┌──────────┐     ┌───────────┐    │   │
│  │                             │  Pass    │     │   Fail    │    │   │
│  │                             │ Continue │     │ Rollback  │    │   │
│  │                             └──────────┘     └───────────┘    │   │
│  │                                    │                            │   │
│  │                                    ▼                            │   │
│  │                         ┌──────────────────┐                   │   │
│  │                         │  Production      │                   │   │
│  │                         │  (Manual Gate)   │                   │   │
│  │                         └──────────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Environment URLs

| Environment | Backend | Frontend |
|-------------|---------|----------|
| Production | `https://salonos-backend-prod-*.a.run.app` | `https://salonos-owner-frontend-prod-*.a.run.app` |
| Staging | `https://salonos-backend-*.a.run.app` | `https://salonos-owner-frontend-*.a.run.app` |

### Quick Deployment Commands

```bash
# Navigate to project
cd /a0/usr/projects/jh_salon_twin

# Deploy Backend
set -a && source backend/.env && set +a
export SALON_ID=b0dcbd9e-1ca0-450e-a299-7ad239f848f4
bash scripts/redeploy_backend_cloudrun.sh

# Deploy Frontend
bash scripts/deploy_frontend_next_cloudrun.sh

# Sync after successful deployment
./scripts/git_sync_after_gcp_success.sh "chore: deployment sync"
./scripts/release_after_gcp_success.sh v1.x.x
```

### Database Migrations

```bash
cd backend

# Run pending migrations
npx dbmate migrate

# Or via SQL directly
psql "$DATABASE_URL" -f db/migrations/*.sql
```

---

## 🧪 Testing

### E2E Test Suite

```bash
cd e2e

# Install browsers
npx playwright install chromium

# Run all tests
npx playwright test

# Run specific spec
npx playwright test tests/login.spec.ts

# Mobile viewport
npx playwright test --project=mobile

# Visual regression
npx playwright test tests/visual-comparison.spec.ts

# With UI
npx playwright test --ui
```

### Test Specs

| Spec | Description |
|------|-------------|
| `login.spec.ts` | Authentication flows |
| `dashboard.spec.ts` | Dashboard load and KPIs |
| `booking.spec.ts` | Client booking flow |
| `pos.spec.ts` | POS operations |
| `pos-payment.spec.ts` | Payment processing |
| `drag-drop-scheduling.spec.ts` | Calendar interactions |
| `bulk-operations.spec.ts` | Bulk client management |
| `command-palette.spec.ts` | Quick actions |
| `visual-comparison.spec.ts` | Visual regression |

---

## 🔐 Security

### Authentication Flow

```
1. POST /api/auth/login { email, password }
   
2. Server validates credentials
   
3. Returns:
   {
     "accessToken": "eyJhbG...",    // 15 min expiry
     "refreshToken": "eyJhbG...",   // 7 days expiry
     "user": { id, email, name, role }
   }

4. Client stores tokens

5. API calls include:
   Authorization: Bearer <accessToken>

6. On 401: POST /api/auth/refresh
   { refreshToken: "eyJhbG..." }
```

### Secret Management

```typescript
// backend/src/config/secrets.ts
// All secrets loaded from GCP Secret Manager

const JWT_SECRET = await secretManager.getSecret('salonos-jwt-secret');
const REFRESH_SECRET = await secretManager.getSecret('salonos-refresh-secret');
const DB_PASSWORD = await secretManager.getSecret('salonos-db-password');
const OPENROUTER_KEY = await secretManager.getSecret('salonos-openrouter-key');
const TWILIO_CREDS = await secretManager.getSecret('salonos-twilio-credentials');
```

### Required Secrets

| Secret | Purpose |
|--------|---------|
| `salonos-jwt-secret` | JWT access token signing |
| `salonos-refresh-secret` | Refresh token signing |
| `salonos-db-password` | PostgreSQL password |
| `salonos-openrouter-key` | OpenRouter AI API key |
| `salonos-twilio-credentials` | Twilio SID + Token |

---

## 📈 Monitoring

### Health Endpoints

```bash
# Backend health
curl https://salonos-backend-*.a.run.app/health

# Detailed health (DB + Redis)
curl https://salonos-backend-*.a.run.app/api/health

# System diagnostics
curl https://salonos-backend-*.a.run.app/api/diagnostics
```

### Cloud Run Logs

```bash
# Backend logs
gcloud run services logs read salonos-backend --region=us-central1 --follow

# Frontend logs
gcloud run services logs read salonos-owner-frontend --region=us-central1 --follow
```

### Service Status

```bash
gcloud run services list --project=salon-saas-487508 --region=us-central1
```

---

## 🐛 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check database connectivity
psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" -c "SELECT 1"

# Check Redis
redis-cli ping

# Test TCP handshake
node backend/scripts/test_tcp_handshake.js

# View logs
tail -f backend/server.log
```

#### Frontend Build Failures
```bash
# Clear Next.js cache
cd frontend-next
rm -rf .next
npm run build

# Verify API URL
echo $NEXT_PUBLIC_API_BASE_URL
```

#### Database Connection Issues
```bash
# Run with cloud-sql-proxy
cloud-sql-proxy --port 5432 $INSTANCE_CONNECTION_NAME

# Verify connection
psql "postgresql://user:pass@localhost:5432/db" -c "SELECT NOW()"
```

#### 404 on Deployed Routes
1. Check `src/app` route structure
2. Verify page components exist
3. Ensure 'use client' directives
4. Rebuild: `npm run build`
5. Redeploy and verify

---

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Clone** your fork
3. **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Make changes** with proper TypeScript
5. **Test** locally (`npm run test`)
6. **Commit** with clear messages
7. **Push** to your fork
8. **Open** Pull Request

### Code Standards

- TypeScript strict mode
- ESLint + Prettier formatting
- Zod schemas for all API inputs
- Unit tests for new services
- Update README for new endpoints

---

## 📝 AI Agent Instructions

This section provides guidance for AI agents working with SalonOS.

### Quick Reference Commands

```bash
# Project root
PROJECT_ROOT="/a0/usr/projects/jh_salon_twin"

# Deploy Backend
cd $PROJECT_ROOT
set -a && source backend/.env && set +a
export SALON_ID=b0dcbd9e-1ca0-450e-a299-7ad239f848f4
bash scripts/redeploy_backend_cloudrun.sh

# Deploy Frontend
bash scripts/deploy_frontend_next_cloudrun.sh

# Run Migrations
cd $PROJECT_ROOT/backend
npx dbmate migrate

# Run E2E Tests
cd $PROJECT_ROOT/e2e
npx playwright test --project=chromium

# Check Health
curl https://salonos-backend-*.a.run.app/health

# View Logs
gcloud run services logs read salonos-backend --region=us-central1 --limit=50
```

### Key Files Reference

| Component | Key Files |
|-----------|----------|
| Backend Entry | `backend/src/index.ts` |
| Auth Middleware | `backend/src/middleware/auth.ts` |
| JWT Config | `backend/src/config/secrets.ts` |
| API Routes | `backend/src/routes/*.ts` |
| Services | `backend/src/services/*.ts` |
| Repositories | `backend/src/repositories/*.ts` |
| Frontend App | `frontend-next/src/app/` |
| Components | `frontend-next/src/components/` |
| E2E Tests | `e2e/tests/*.spec.ts` |
| Workflows | `.github/workflows/*.yml` |
| Migrations | `db/migrations/*.sql` |
| Schema | `db/schema.sql` |

### Architecture Patterns

- **Repository Pattern**: Data access via `backend/src/repositories/`
- **Service Layer**: Business logic in `backend/src/services/`
- **Zod Validation**: All inputs validated via `backend/src/schemas/`
- **JWT Auth**: Middleware validates tokens, attaches user to `req.user`
- **Event-Driven**: Twilio webhooks post to `/webhooks/twilio/*`
- **AI Orchestration**: AI services coordinate via `AIRevenueBrain`, `BookingOrchestrator`

### Project Constants

```typescript
// GCP Project
const GCP_PROJECT = 'salon-saas-487508';
const GCP_REGION = 'us-central1';

// Salon ID (Production)
const SALON_ID = 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

// Database
const DB_HOST = '34.29.171.92';
const DB_PORT = 5432;
const DB_NAME = 'postgres';

// Cloud Run Services
const BACKEND_SERVICE = 'salonos-backend';
const OWNER_FRONTEND = 'salonos-owner-frontend';
const CLIENT_PWA = 'salonos-client-pwa';
```

---

## 📜 License

Proprietary software. All rights reserved.

---

## 📞 Support

- **Issues:** https://github.com/Akram0307/jh-salon-twin/issues
- **Disaster Recovery:** See `docs/disaster-recovery-runbook.md`

---

**Document Version:** 1.1.0  
**Last Updated:** 2026-03-19  
**Status:** Production Ready  
**Repository:** https://github.com/Akram0307/jh-salon-twin
