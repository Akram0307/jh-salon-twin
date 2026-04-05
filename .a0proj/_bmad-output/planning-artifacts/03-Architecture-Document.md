# Architecture Design Document
**Project:** Jawed Habib Salon Digital Twin  
**Version:** 1.0  
**Status:** DRAFT  
**Author:** Winston (Architect) via Agent Zero  
**Date:** 2026-04-05  

---

## 1. Architectural Overview
The system employs an **Event-Driven Micro-Core architecture**. Agent Zero serves as the "Brain" (Orchestrator), while a custom **FastAPI Backend** serves as the "Body" (Data & Logic execution). A lightweight **Streamlit Dashboard** provides the "Face" (Visual Monitoring) for the physical salon.

```mermaid
graph TD
    User[Salon Manager/Stylist] -->|Voice/Text| A0[Agent Zero (Orchestrator)]
    User -->|Web View| UI[Streamlit Dashboard]
    A0 -->|HTTP Requests| API[FastAPI Backend]
    UI -->|Live Data Fetch| API
    API -->|Read/Write| DB[(SQLite Database)]
    API -->|Logic| Twin[Salon Twin Engine (Python)]
    Twin -->|Alerts/Actions| API
```

## 2. Technology Stack Selection
| Component | Technology | Justification |
|---|---|---|
| **Language** | Python 3.11+ | Native integration with Agent Zero and AI libraries. |
| **API Framework** | FastAPI | High performance, async support for real-time updates, auto-generated docs. |
| **Database** | SQLite | Serverless, zero-config, robust enough for single-branch salon data. Easy backup. |
| **AI Engine** | Agent Zero / LLM | Handles complex scheduling queries, natural language booking, and bottleneck optimization. |
| **Dashboard** | Streamlit | Rapid prototyping of the "Digital Twin" visual representation (Gantt charts, Station status). |

## 3. Core Modules Design

### 3.1 The Twin Engine (Scheduler)
The most complex module. It does not just store time; it manages **Resource Constraints**.
- **Graph-Based Scheduling:** A service (e.g., "Men's Haircut") is linked to required resources (1 Stylist Chair + **Men's Wash Bay**).
- **Bottleneck Resolution:** The scheduler prioritizes resources that are scarce. Since "Men's Wash Bay" count = 1, it acts as a **global lock**. No two services requiring the wash bay can overlap.

### 3.2 Inventory Sub-System
- **Recipe System:** Each service has a 'recipe' of materials (e.g., `Hair Color: 30ml`, `Shampoo: 10ml`).
- **Predictive Stock:** `Current Stock` - `(Upcoming Bookings * Usage) = Projected Stock`. Alert if `Projected < Safety Level`.

## 4. Database Schema (Draft)

### 4.1 Entities
- **Resources**: The physical stations (e.g., `Men-Wash-01`, `Ladies-Cut-03`). Defined by `Type` and `Capabilities`.
- **Staff**: Employees mapped to specific Skills (e.g., *Can do Color*, *Can do Cut*).
- **Services**: Defined in `service-catalog.json`.
- **Appointments**: The intersection of Service, Staff, Resources, Time Slots, and Client.

### 4.2 SQL Structure Concept

```sql
-- Resources (The physical stations)
CREATE TABLE resources (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,       -- e.g., 'Mens-Wash-Bay-1'
    type TEXT,              -- 'Wash', 'Cut', 'Facial', 'Pedi'
    is_active BOOLEAN DEFAULT 1
);

-- Appointments (The bookings)
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY,
    client_name TEXT,
    service_id TEXT,        -- Links to service-catalog.json
    staff_id INTEGER,
    resource_ids TEXT,      -- JSON list of resource IDs used (e.g. ["Cut-Chair-1", "Mens-Wash-Bay-1"])
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status TEXT             -- 'Confirmed', 'In-Progress', 'Completed', 'Cancelled'
);

-- Inventory
CREATE TABLE inventory (
    item_name TEXT PRIMARY KEY,
    current_stock REAL,
    unit TEXT,              -- 'ml', 'units', 'packets'
    safety_level REAL
);
```

## 5. API Structure
- `GET /api/status/dashboard` -> Returns real-time status of all 19 stations for the UI.
- `POST /api/book` -> Accepts service requests, runs Twin Engine logic, checks bottlenecks (Wash Bay conflict), returns slot or error.
- `GET /api/inventory/report` -> Returns usage analytics and reorder suggestions.

## 6. Development Strategy
1. **Scaffold:** Set up FastAPI project structure.
2. **Data:** Ingest the `service-catalog.json` into the system.
3. **Logic:** Build the `Twin Engine` with constraint checking.
4. **UI:** Deploy a basic Streamlit dashboard.
5. **Integrate:** Connect Agent Zero to the API for voice/text management.

---
*Note: This architecture is designed to be modular. We can swap the UI or Database later if the salon scales to multiple branches.*
