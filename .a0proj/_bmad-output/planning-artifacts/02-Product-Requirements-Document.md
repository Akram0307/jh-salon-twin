# Product Requirements Document (PRD)
**Project:** Jawed Habib Salon Digital Twin  
**Version:** 1.0  
**Date:** 2026-04-05  
**Author:** John (Product Manager via Agent Zero)  
**Status:** DRAFT - Ready for Architecture Phase  

---

## 1. Executive Summary
The **Salon Digital Twin** is an intelligent, proactive operational system for **Jawed Habib Hair & Beauty Salon, Kurnool**. Unlike a passive booking system, the Digital Twin actively manages 19 workstations, enforces resource constraints (critical washing bays), and optimizes staff allocation to maximize revenue and customer satisfaction.

## 2. Problem Statement
- **Resource Bottlenecks:** The Men's Section has **6 cutting chairs** but only **1 washing bay**, creating a high risk of scheduling conflicts and idle time.
- **Complex Inventory:** Managing diverse products for Hair, Skin, and Nails across 268+ service items is inefficient manually.
- **Lack of Proactivity:** Current systems cannot predict delays or automatically suggest upsells based on wait times.

## 3. Scope & Objectives
- **Core Objective:** Build a system that acts as the salon's "Central Brain", automating scheduling, inventory, and client relations.
- **Data Source:** The system will utilize the ingested **Service Catalog** (`service-catalog.json`) for all pricing, duration, and category logic.
- **Key Metric:** Reduce Chair Idle Time by 20%, Eliminate Booking Conflicts 100%.

## 4. Functional Requirements

### 4.1 Intelligent Scheduling Engine (The Core)
- **SR-1.1 Constraint Enforcement:** System must strictly enforce capacity limits:
  - **Women:** 4 Cuts, 1 Wash, 2 Facial Rms, 2 Pedi/Mani.
  - **Men:** 6 Cuts, **1 Wash (CRITICAL)**, 2 Facial Rms, 1 Pedi/Mani.
- **SR-1.2 Dynamic Slotting:** Calculate service durations dynamically. If `Men Wash` takes 15 mins, system must stagger `Men Hair Cut` (30 mins) to ensure the bay is free.
- **SR-1.3 Gap Management:** Auto-fill gaps or buffer times to prevent cascading delays.

### 4.2 Service & Pricing Management
- **SR-2.1 Catalog Integration:** System loads `service-catalog.json` at startup for all service definitions.
- **SR-2.2 Bundling Logic:** Support for "Combos" (e.g., *The Smart Look*) where total price is discounted and duration is summed or optimized.

### 4.3 Client Relationship Management (CRM)
- **SR-3.1 Client Profiles:** Store visit history, preferences (e.g., "Hot water wash"), and allergy data.
- **SR-3.2 Automated Reminders:** WhatsApp/SMS integration 24h and 2h before appointment.

### 4.4 Inventory Control
- **SR-4.1 Usage Tracking:** Deduct products per service type (e.g., `D-Tan` uses `D-Tan Gel`).
- **SR-4.2 Predictive Reordering:** AI suggests reordering when stock hits threshold based on upcoming bookings.

### 4.5 The 'Digital Twin' Features
- **SR-5.1 Simulation Mode:** Ability to simulate "What if we add 1 more stylist?" to project revenue impact.
- **SR-5.2 Real-Time Optimization:** AI alerts manager if a stylist is idle while clients are waiting, suggesting specific re-assignments.

## 5. Non-Functional Requirements
- **Performance:** Booking check < 100ms.
- **Availability:** 99.9% uptime (Cloud-hosted).
- **Security:** GDPR/PDP compliant client data storage.
- **Usability:** Mobile-first interface for Stylists (Tablet/Kiosk), Desktop for Admin.

## 6. Technical Assumptions
- **Stack:** Python (FastAPI), SQLite/PostgreSQL, React/Vue for UI.
- **AI Engine:** Agent Zero (local LLM) for scheduling logic and chat interactions.
- **Communication:** WhatsApp Business API for client notifications.

## 7. Next Steps
1. **Architecture Design:** Winston (Architect) to design DB Schema and API structure.
2. **UI/UX Design:** Sally (UX) to wireframe the Booking Flow.
3. **Validation:** Review PRD with Stakeholder (User).

---
*Reference: Service Catalog file `main/service-catalog.json` contains full data.*