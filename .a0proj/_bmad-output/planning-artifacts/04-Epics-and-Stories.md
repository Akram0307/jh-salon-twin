# Epics and Stories
**Project:** Jawed Habib Salon Digital Twin  
**Version:** 1.0  
**Status:** Planned  
**Based on:** `02-PRD.md`, `03-Architecture-Document.md`  

---

## Epic 1: Core Foundation & Data Ingestion
**Goal:** Set up the FastAPI environment, SQLite database, and ingest the 268-item Service Catalog.

| ID | Story | Priority | Notes |
|:---|:---|:---|:---|
| **1.1** | **Setup Backend Scaffold** | High | Python/FastAPI, Virtual Env, Dockerfile. |
| **1.2** | **Database Schema Migration** | High | Implement tables: `Resources`, `Staff`, `Appointments`, `Inventory`. |
| **1.3** | **Service Catalog Ingestion** | Medium | Script to parse `service-catalog.json` and populate DB. |

---

## Epic 2: The Twin Engine (Scheduling Logic)
**Goal:** Build the core algorithm that ensures no resource collisions, specifically the **Men's Washing Bay**.

| ID | Story | Priority | Notes |
|:---|:---|:---|:---|
| **2.1** | **Resource Constraint Definition** | Critical | Define capabilities for the 19 workstations (e.g., `Mens-Wash-Bay-1`). |
| **2.2** | **Booking Validation Logic** | Critical | Algorithm to check `Resource` + `Time` availability. Must fail if Bay busy. |
| **2.3** | **Combo Package Logic** | High | Handle "Bundles" (Duration = Max(Svc A, Svc B)? Or Sum?). Usually sequential or parallel based on resource. |

---

## Epic 3: Booking API & Client Management
**Goal:** Implement endpoints to create/manage bookings and store client data.

| ID | Story | Priority | Notes |
|:---|:---|:---|:---|
| **3.1** | **Create Booking Endpoint** | High | Input: `Client`, `Service`, `Time`. Output: `Confirmation` or `ConflictError`. |
| **3.2** | **Client Profile Management** | Medium | CRUD for Clients with history tracking. |
| **3.3** | **Waitlist Management** | Low | Queue mechanism when preferred slots are full. |

---

## Epic 4: Digital Twin Dashboard
**Goal:** A visual interface for the Salon Manager to see real-time status.

| ID | Story | Priority | Notes |
|:---|:---|:---|:---|
| **4.1** | **Streamlit Dashboard Setup** | Medium | Basic UI structure using Streamlit. |
| **4.2** | **Live Status View** | High | Gantt chart or Grid showing current/next booking for all 19 seats. |
| **4.3** | **Alerting System** | Medium | UI popups for "Bay Blocked" or "Staff Idle". |

---

## Acceptance Criteria (Sample - Story 2.2)
**Scenario:** User tries to book "Men's Haircut + Wash" when the Bay is busy.
**Given:** `Mens-Wash-Bay-1` is booked 10:00-10:15.
**When:** A request comes for a service requiring that bay at 10:00.
**Then:** The system rejects the booking and suggests `10:15`.
