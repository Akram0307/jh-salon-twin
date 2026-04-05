# SalonOS Agent Workflow Mappings

This document defines **task routing, delegation, and execution rules** for the **JH_SALON_TWIN** project.

The system follows a **lead-first multi-domain architecture**. Agent Zero orchestrates work by routing every significant task to the correct **team lead** first, then to approved specialists.

---

# Core Lead Domains

The platform is governed by these lead agents:

## Product
- `product_strategist`

## Frontend
- `frontend_architect`

## Backend
- `backend_architect`

## AI Systems
- `ai_systems_architect`

## Quality
- `qa_strategy_lead`

## DevOps
- `devops_platform_lead`

## Observability
- `observability_architect`

## Security
- `security_architect`

## Analytics
- `analytics_lead`

## Cloud
- `cloud_architect`

---

# Domain Classification Rule

Before executing any significant task in `/a0/usr/projects/jh_salon_twin`, classify it into one or more of these domains:

- `frontend`
- `backend`
- `ai`
- `quality`
- `devops`
- `observability`
- `security`
- `analytics`
- `product`
- `cloud`

The **primary domain** determines the initial lead agent.
Cross-domain work must be split into subtasks or explicitly supported by additional leads.

---

# Orchestration Rule

All significant tasks follow this hierarchy:

`User / Agent Zero -> Team Lead -> Specialist Agent -> Verification -> Deployment / Closeout`

Mandatory policies:

- No specialist agent executes significant work without **team lead delegation**.
- Every significant task must be registered in `planned_tasks.json`.
- Task lifecycle must be updated through `pending -> in_progress -> completed`.
- Completion requires evidence that success criteria were met.

---

# Team Execution Structure

## Product Team
Lead: `product_strategist`

Specialists:
- `product_manager`

Responsibilities:
- roadmap and feature sequencing
- requirements definition
- launch and onboarding planning
- cross-team coordination

## Frontend Team
Lead: `frontend_architect`

Specialists:
- `design_system_enforcer`
- `component_architect`
- `client_pwa_ux_specialist`
- `responsive_mobile_ux_engineer`
- `frontend_state_data_flow_engineer`
- `accessibility_interaction_qa_agent`
- `performance_optimization_agent`
- `motion_microinteraction_designer`
- `frontend_test_automation_agent`
- `visual_regression_auditor`
- `forms_validation_specialist`
- `api_contract_integration_agent`

Responsibilities:
- React architecture
- Tailwind / shadcn design system
- PWA experience and responsiveness
- accessibility and frontend performance
- frontend integration verification

## Backend Team
Lead: `backend_architect`

Specialists:
- `backend_engineer`
- `database_engineer`
- `integration_specialist`

Responsibilities:
- API design and business logic
- repository/service architecture
- PostgreSQL schema and performance
- third-party integrations and messaging

## AI Systems Team
Lead: `ai_systems_architect`

Specialists:
- `genkit_ai_engineer`
- `autonomous_receptionist`

Responsibilities:
- AI concierge and receptionist flows
- Genkit / Gemini / Vertex orchestration
- evaluation and agent behavior design

## Quality Team
Lead: `qa_strategy_lead`

Specialists:
- `e2e_testing_agent`
- `frontend_test_automation_agent`

Responsibilities:
- regression testing
- browser automation
- release verification
- contract and smoke coverage

## DevOps Team
Lead: `devops_platform_lead`

Specialists:
- `ci_cd_orchestrator`

Responsibilities:
- CI/CD pipelines
- build and release automation
- deployment execution reliability

## Observability Team
Lead: `observability_architect`

Specialists:
- `observability_agent`

Responsibilities:
- logging, tracing, metrics
- alerting and telemetry quality
- operational signal design

## Security Team
Lead: `security_architect`

Specialists:
- `security_auditor`

Responsibilities:
- AppSec review
- hardening and secure coding checks
- risk assessment before release

## Analytics Team
Lead: `analytics_lead`

Specialists:
- `data_scientist`

Responsibilities:
- KPI design
- behavioral analysis
- intelligence reporting and forecasting support

## Cloud Team
Lead: `cloud_architect`

Responsibilities:
- GCP architecture
- Cloud Run topology
- networking and runtime posture

---

# Task Lifecycle

1. Register task in `planned_tasks.json`
2. Assign primary ownership to the correct **team lead**
3. Delegate execution to specialists as needed
4. Verify success criteria with evidence
5. If production-affecting, route deployment through DevOps / Cloud
6. Mark task completed only after verification

---

# Completion Evidence Standards

Acceptable evidence includes:

- modified file paths
- successful build / test outputs
- deployed revision IDs or live URLs
- screenshots or audit reports
- migration filenames and execution notes

A task must not be marked `completed` if any stated success criterion is still unmet.

---

# Scaling Model

New agents may be added only as:

- a new approved lead for a new domain, or
- a specialist reporting to an existing lead

The system must remain a **professional engineering organization**, not a flat swarm.

---

# Security Team Skill Mappings

## Security Architect Verified Skills

The following skills are verified and mapped to the `security_architect` role for SalonOS security operations:

### 1. postgresql-database-engineering
- **Path:** `/a0/skills/postgresql-database-engineering`
- **Purpose:** Database security hardening, access control, encryption, audit logging
- **Capabilities:**
  - PostgreSQL security configuration
  - Row-level security (RLS) policies
  - Audit logging setup
  - Connection security (SSL/TLS)
  - Role-based access control
  - Query performance security analysis
- **Use Cases:**
  - Database hardening for production
  - Implementing data access controls
  - Setting up audit trails for compliance
  - Securing database connections

### 2. deploying-on-gcp
- **Path:** `/a0/skills/deploying-on-gcp`
- **Purpose:** Secure cloud deployment, IAM policies, network security
- **Capabilities:**
  - GCP IAM configuration
  - VPC and firewall rules
  - Secret management (Secret Manager)
  - Cloud Run security settings
  - Container security best practices
  - SSL/TLS certificate management
- **Use Cases:**
  - Secure Cloud Run deployments
  - Implementing least-privilege IAM
  - Network security configuration
  - Secret and credential management

### 3. twilio-api
- **Path:** `/a0/skills/twilio-api`
- **Purpose:** Secure webhook integration, signature validation, communication security
- **Capabilities:**
  - Webhook signature validation (HMAC-SHA1)
  - Secure SMS/voice integration
  - Provider-agnostic webhook architecture
  - Error handling and retry logic
  - Rate limiting implementation
  - A2P 10DLC compliance
- **Use Cases:**
  - Securing Twilio webhook endpoints
  - Validating incoming SMS/voice requests
  - Implementing secure notification flows
  - Preventing webhook spoofing attacks

---

## Security Audit Capabilities

The Security Architect maintains the following audit tools:

### Security Audit Script
- **Path:** `/a0/usr/projects/jh_salon_twin/scripts/security-audit.sh`
- **Capabilities:**
  - Dependency vulnerability scanning (npm audit)
  - Hardcoded secret detection
  - SQL injection pattern analysis
  - XSS vulnerability detection
  - Configuration validation
  - Authentication/authorization checks
  - Webhook security validation
- **Usage:** `./scripts/security-audit.sh`


---

# Security Team Skill Mappings

## Security Architect Verified Skills

The following skills are verified and mapped to the security_architect role for SalonOS security operations:

### 1. postgresql-database-engineering
- **Path:** /a0/skills/postgresql-database-engineering
- **Purpose:** Database security hardening, access control, encryption, audit logging
- **Capabilities:** PostgreSQL security configuration, Row-level security (RLS) policies, Audit logging setup, Connection security (SSL/TLS), Role-based access control
- **Use Cases:** Database hardening for production, Implementing data access controls, Setting up audit trails

### 2. deploying-on-gcp
- **Path:** /a0/skills/deploying-on-gcp
- **Purpose:** Secure cloud deployment, IAM policies, network security
- **Capabilities:** GCP IAM configuration, VPC and firewall rules, Secret management, Cloud Run security settings, Container security
- **Use Cases:** Secure Cloud Run deployments, Implementing least-privilege IAM, Network security configuration

### 3. twilio-api
- **Path:** /a0/skills/twilio-api
- **Purpose:** Secure webhook integration, signature validation, communication security
- **Capabilities:** Webhook signature validation (HMAC-SHA1), Secure SMS/voice integration, Provider-agnostic webhook architecture
- **Use Cases:** Securing Twilio webhook endpoints, Validating incoming SMS/voice requests, Preventing webhook spoofing

## Security Audit Capabilities

### Security Audit Script
- **Path:** /a0/usr/projects/jh_salon_twin/scripts/security-audit.sh
- **Capabilities:** Dependency vulnerability scanning, Hardcoded secret detection, SQL injection pattern analysis, XSS vulnerability detection, Configuration validation, Authentication/authorization checks
- **Usage:** ./scripts/security-audit.sh

