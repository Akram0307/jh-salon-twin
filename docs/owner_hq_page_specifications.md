# SalonOS Owner HQ: Business Requirements & UX Specifications
**Version:** 1.0  
**Date:** 2026-03-12  
**Author:** Product Strategist  
**Status:** Draft for Review

---

## Executive Summary

SalonOS Owner HQ is the operational command center for premium salon owners, designed as a "Revenue Command Center" with fintech-inspired, data-dense interfaces. This document defines the business requirements and UX specifications for all owner-facing pages, focusing on operational efficiency and revenue intelligence.

---

## 1. Overall Information Architecture

### 1.1 Mental Model: "Invisible COO"
- **Primary Metaphor:** Revenue Command Center
- **Design Archetype:** Stripe Dashboard meets Linear
- **Core Principle:** Decision-first, high-density data presentation

### 1.2 Information Hierarchy
```
Owner HQ
├── Dashboard (Command Center)
├── Clients (CRM Intelligence)
├── Staff (Team Management)
├── Services (Revenue Catalog)
├── Schedule (Time Optimization)
├── Reports (Business Intelligence)
└── Settings (System Configuration)
```

### 1.3 Data Flow Architecture
```
[Client PWA] → [Booking Engine] → [Schedule] → [Staff] → [Services]
       ↓              ↓              ↓          ↓         ↓
[Revenue Data] → [Dashboard KPIs] → [Reports] → [Analytics]
```

---

## 2. Navigation Structure

### 2.1 Primary Navigation
- **Fixed Left Sidebar** (240px width)
- **Collapsed State:** Icon-only (64px)
- **Active State:** Gold accent indicator
- **Grouping:**
  - **Operations:** Dashboard, Schedule, Clients
  - **Management:** Staff, Services
  - **Intelligence:** Reports
  - **System:** Settings

### 2.2 Global Command Bar
- **Position:** Fixed top (56px height)
- **Features:**
  - Universal search (⌘K)
  - Quick actions (New Appointment, Add Client)
  - Notifications center
  - User profile/settings

### 2.3 Contextual Navigation
- **Breadcrumbs:** For deep navigation
- **Tab Navigation:** Within complex pages
- **Slide-out Drawers:** For detailed views without page navigation

---

## 3. Key Workflows

### 3.1 Booking Flow (Owner Perspective)
```
1. View Schedule → 2. Select Time Slot → 3. Choose Client → 4. Select Service → 5. Assign Staff → 6. Confirm
```

### 3.2 Staff Onboarding Flow
```
1. Add Staff Profile → 2. Set Schedule/Availability → 3. Assign Services → 4. Set Commission Rates → 5. Activate
```

### 3.3 Revenue Optimization Workflow
```
1. View Dashboard KPIs → 2. Identify Underperforming Services → 3. Adjust Pricing/Promotions → 4. Monitor Impact in Reports
```

---

## 4. Page Specifications

### 4.1 /owner/dashboard - Operational KPI Cockpit

#### Primary Purpose
Real-time operational command center providing instant visibility into salon performance, critical alerts, and actionable insights.

#### User Goals
- Monitor daily/weekly performance at a glance
- Identify and resolve operational bottlenecks
- Track revenue against targets
- Manage critical alerts and notifications

#### Key Data Points
- **Revenue Pulse:** Today's revenue, week-over-week change, target progress
- **Operational Metrics:**
  - Appointments today/this week
  - Chair utilization rate
  - Average service value
  - Client retention rate
- **Alerts & Actions:**
  - Understaffed time slots
  - Low inventory alerts
  - Client no-shows/cancellations
  - Pending approvals

#### Required Actions/Interactions
- **Quick Actions:** New appointment, add client, view schedule
- **Drill-down:** Click any KPI for detailed breakdown
- **Alert Management:** Acknowledge/resolve alerts
- **Date Range Selector:** Today, week, month, custom

#### MVP vs Future Features
- **MVP:**
  - Real-time revenue tracking
  - Today's schedule overview
  - Critical alerts panel
  - Basic KPI cards
- **Future:**
  - Predictive analytics
  - AI-powered recommendations
  - Custom dashboard widgets
  - Multi-location comparison

#### Page Connections
- **To Schedule:** Click time slots to view/edit appointments
- **To Clients:** Click client names for CRM view
- **To Reports:** Deep-dive analytics from any KPI
- **To Staff:** View staff performance metrics

---

### 4.2 /owner/clients - Client CRM Management

#### Primary Purpose
Comprehensive client relationship management with lifetime value tracking, preferences, and communication history.

#### User Goals
- View complete client profiles and history
- Identify high-value clients and at-risk clients
- Manage client communications
- Track client preferences and notes

#### Key Data Points
- **Client Profile:**
  - Contact information
  - Visit history
  - Total spend (lifetime value)
  - Preferred services/staff
  - Notes and preferences
- **Segmentation:**
  - New vs returning clients
  - High-value clients (top 20%)
  - At-risk clients (declining visits)
  - VIP clients

#### Required Actions/Interactions
- **Search & Filter:** By name, tags, spend, last visit
- **Client Actions:** Book appointment, send message, add note
- **Bulk Actions:** Send promotions, export data
- **Import/Export:** CSV client import

#### MVP vs Future Features
- **MVP:**
  - Client list with search/filter
  - Basic client profiles
  - Visit history
  - Manual notes
- **Future:**
  - AI-powered client insights
  - Automated retention campaigns
  - Client lifetime value predictions
  - Integration with marketing tools

#### Page Connections
- **To Schedule:** Book appointments directly from client profile
- **To Services:** View client's service preferences
- **To Staff:** See which staff members serve this client
- **To Reports:** Client segmentation analytics

---

### 4.3 /owner/staff - Staff Management & Scheduling

#### Primary Purpose
Complete staff management including scheduling, performance tracking, commission management, and capacity planning.

#### User Goals
- Manage staff schedules and availability
- Track individual performance metrics
- Calculate commissions and compensation
- Optimize staff utilization

#### Key Data Points
- **Staff Profiles:**
  - Contact information
  - Skills/services offered
  - Schedule/availability
  - Commission rates
- **Performance Metrics:**
  - Revenue generated
  - Client retention rate
  - Average service value
  - Utilization rate
- **Schedule View:**
  - Weekly/monthly calendar
  - Availability blocks
  - Time-off requests

#### Required Actions/Interactions
- **Schedule Management:** Drag-and-drop scheduling
- **Performance Reviews:** Set goals, track progress
- **Commission Calculation:** View/edit commission structures
- **Availability Management:** Set recurring availability

#### MVP vs Future Features
- **MVP:**
  - Staff list with profiles
  - Basic schedule management
  - Manual commission tracking
  - Performance metrics view
- **Future:**
  - AI-optimized scheduling
  - Automated commission calculations
  - Performance benchmarking
  - Team capacity forecasting

#### Page Connections
- **To Schedule:** View staff's appointments
- **To Services:** Manage staff's service offerings
- **To Reports:** Staff performance analytics
- **To Dashboard:** Staff utilization KPIs

---

### 4.4 /owner/services - Service Catalog Management

#### Primary Purpose
Comprehensive service catalog management with pricing optimization, package creation, and performance analytics.

#### User Goals
- Manage service offerings and pricing
- Create service packages and bundles
- Track service performance and profitability
- Optimize service mix for revenue

#### Key Data Points
- **Service Catalog:**
  - Service name, description, duration
  - Pricing (regular, premium, packages)
  - Category/tags
  - Assigned staff
- **Performance Metrics:**
  - Bookings count
  - Revenue generated
  - Profit margin
  - Client satisfaction
- **Package Management:**
  - Bundle composition
  - Package pricing
  - Usage statistics

#### Required Actions/Interactions
- **Service CRUD:** Create, read, update, delete services
- **Pricing Management:** Set/edit prices, create discounts
- **Package Builder:** Drag-and-drop package creation
- **Category Management:** Organize services by category

#### MVP vs Future Features
- **MVP:**
  - Service list with CRUD operations
  - Basic pricing management
  - Simple package creation
  - Service performance metrics
- **Future:**
  - Dynamic pricing optimization
  - AI-recommended service bundles
  - Competitor price benchmarking
  - Seasonal pricing automation

#### Page Connections
- **To Staff:** Assign services to staff members
- **To Schedule:** Services appear in booking flow
- **To Clients:** Client service preferences
- **To Reports:** Service profitability analytics

---

### 4.5 /owner/schedule - Appointment Calendar/Scheduling

#### Primary Purpose
Advanced appointment scheduling with drag-and-drop interface, resource optimization, and real-time availability management.

#### User Goals
- View and manage all appointments
- Optimize staff and resource allocation
- Handle walk-ins and last-minute changes
- Minimize gaps and maximize utilization

#### Key Data Points
- **Calendar Views:**
  - Day/week/month views
  - Staff-specific views
  - Resource views (chairs, rooms)
- **Appointment Details:**
  - Client, service, staff
  - Duration, price
  - Status (confirmed, checked-in, completed)
  - Notes and special requests
- **Availability:**
  - Staff availability
  - Resource availability
  - Blocked time slots

#### Required Actions/Interactions
- **Drag-and-Drop:** Reschedule appointments
- **Quick Booking:** Click empty slot to book
- **Status Management:** Check-in, complete, cancel
- **Waitlist Management:** View/manage waitlisted clients

#### MVP vs Future Features
- **MVP:**
  - Calendar with multiple views
  - Basic appointment management
  - Drag-and-drop rescheduling
  - Simple availability management
- **Future:**
  - AI-optimized scheduling suggestions
  - Automated conflict resolution
  - Predictive no-show management
  - Multi-location scheduling

#### Page Connections
- **To Clients:** View client details from appointment
- **To Staff:** View staff schedule and availability
- **To Services:** Service details and pricing
- **To Dashboard:** Real-time schedule metrics

---

### 4.6 /owner/reports - Business Analytics & Reports

#### Primary Purpose
Comprehensive business intelligence with customizable reports, trend analysis, and actionable insights for revenue optimization.

#### User Goals
- Analyze business performance trends
- Generate custom reports for specific needs
- Identify growth opportunities
- Make data-driven decisions

#### Key Data Points
- **Standard Reports:**
  - Revenue reports (daily, weekly, monthly)
  - Staff performance reports
  - Service popularity reports
  - Client retention reports
- **Custom Analytics:**
  - Date range comparisons
  - Filter by staff, service, client segment
  - Export capabilities (CSV, PDF)
- **Visualizations:**
  - Trend lines
  - Bar charts
  - Heat maps
  - Pie charts

#### Required Actions/Interactions
- **Report Builder:** Select metrics, filters, date ranges
- **Schedule Reports:** Automated report generation
- **Export Options:** Download in various formats
- **Share Reports:** Email reports to stakeholders

#### MVP vs Future Features
- **MVP:**
  - Pre-built report templates
  - Basic date range filtering
  - Simple visualizations
  - CSV export
- **Future:**
  - Custom report builder
  - Predictive analytics
  - Automated insights generation
  - Benchmarking against industry standards

#### Page Connections
- **To Dashboard:** Drill-down from KPIs
- **To All Pages:** Data aggregation from all modules
- **To Settings:** Report scheduling configuration

---

### 4.7 /owner/settings - Salon Configuration

#### Primary Purpose
System configuration and salon profile management with integration settings, business rules, and user management.

#### User Goals
- Configure salon profile and business rules
- Manage user access and permissions
- Set up integrations and automations
- Customize system behavior

#### Key Data Points
- **Salon Profile:**
  - Business information
  - Location details
  - Branding assets
  - Business hours
- **System Configuration:**
  - Booking rules
  - Notification preferences
  - Payment settings
  - Tax configuration
- **User Management:**
  - Staff accounts
  - Role-based permissions
  - Access logs

#### Required Actions/Interactions
- **Profile Management:** Edit salon information
- **Business Rules:** Configure booking policies
- **Integration Setup:** Connect payment, marketing tools
- **User Administration:** Add/remove users, set permissions

#### MVP vs Future Features
- **MVP:**
  - Basic salon profile editing
  - Business hours configuration
  - Simple user management
  - Essential integrations
- **Future:**
  - Advanced automation rules
  - Multi-location management
  - Custom workflow builder
  - API access management

#### Page Connections
- **To All Pages:** Settings affect all system behavior
- **To Dashboard:** Configuration status indicators
- **To Staff:** User account management

---

## 5. Cross-Page Integration Patterns

### 5.1 Data Consistency
- **Real-time Updates:** Changes reflect immediately across all pages
- **Conflict Resolution:** Optimistic UI with conflict detection
- **Offline Support:** Queue changes when offline

### 5.2 Navigation Patterns
- **Deep Linking:** Direct links to specific records
- **Context Preservation:** Maintain filters/search when navigating
- **Quick Switching:** Keyboard shortcuts for power users

### 5.3 Notification System
- **In-App Notifications:** Real-time alerts
- **Notification Center:** Centralized notification management
- **Priority Levels:** Critical, warning, informational

---

## 6. Success Metrics

### 6.1 Operational Efficiency
- **Time to Complete Tasks:** Target < 30 seconds for common actions
- **Error Rate:** < 1% for critical operations
- **User Satisfaction:** > 4.5/5 rating

### 6.2 Revenue Impact
- **Revenue Visibility:** Real-time within 5 minutes
- **Decision Speed:** 50% faster than previous system
- **Upsell Identification:** 20% increase in service packages

---

## 7. Implementation Roadmap

### Phase 1: MVP (Weeks 1-4)
1. Dashboard with core KPIs
2. Basic client management
3. Simple staff scheduling
4. Service catalog

### Phase 2: Enhanced Operations (Weeks 5-8)
1. Advanced scheduling features
2. Comprehensive reporting
3. Settings and configuration
4. Integration foundations

### Phase 3: Intelligence Layer (Weeks 9-12)
1. AI-powered insights
2. Predictive analytics
3. Advanced automation
4. Multi-location support

---

## Appendix: Design System Alignment

### Color Usage
- **Revenue Metrics:** Emerald-400 (positive), Rose-400 (negative)
- **Action Items:** Gold-400 (primary), Slate-800 (secondary)
- **Alerts:** Rose-400 (critical), Amber-400 (warning)

### Component Standards
- **KPI Cards:** 12px radius, 1.5rem padding, monospace numbers
- **Data Tables:** Zebra striping, sortable headers, inline actions
- **Forms:** Floating labels, inline validation, auto-save

### Typography Hierarchy
- **Page Titles:** Inter 24px Bold
- **Section Headers:** Inter 18px Semibold
- **Data Labels:** Inter 14px Medium
- **Numbers:** JetBrains Mono 14px Regular

---

*This specification is aligned with SalonOS Design Principles v1.0 and the "Operational Luxury" philosophy.*
