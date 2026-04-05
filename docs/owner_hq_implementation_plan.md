# SalonOS Owner HQ - Complete Implementation Plan

## Executive Summary
This document provides a comprehensive implementation plan for all 7 owner-facing pages in the Next.js 14 Owner HQ. The plan builds upon the existing design token system (OKLCH-based), shadcn/ui patterns, and established TypeScript interfaces.

## Current State Analysis
- **Framework**: Next.js 14 with App Router
- **Design System**: Three-tier OKLCH design tokens in `src/lib/design-tokens.ts`
- **Existing Components**: OwnerShell, OwnerSidebar, OwnerTopbar, PlaceholderPage
- **API Client**: `apiFetch` utility in `src/lib/api.ts`
- **TypeScript Types**: Comprehensive interfaces in `src/types/index.ts`
- **State Management**: @tanstack/react-query installed but not utilized
- **Current Pages**: Mostly placeholder implementations with mock data

---

## I. Shared Components Architecture

### A. Core UI Components (to create)
```typescript
// src/components/ui/data-table.tsx
- Generic DataTable with sorting, filtering, pagination
- Column definitions with TypeScript generics
- Export functionality (CSV, PDF)

// src/components/ui/kpi-card.tsx
- KPI display with trend indicators
- Sparkline charts for mini visualizations
- Loading and error states

// src/components/ui/search-input.tsx
- Debounced search with loading indicator
- Recent searches history
- Keyboard navigation

// src/components/ui/date-range-picker.tsx
- Preset ranges (Today, This Week, This Month, Custom)
- Calendar integration
- Timezone support

// src/components/ui/status-badge.tsx
- Status indicators with semantic colors
- Animated transitions
- Tooltips with status details

// src/components/ui/action-menu.tsx
- Context menu for row actions
- Keyboard shortcuts
- Confirmation dialogs

// src/components/ui/empty-state.tsx
- Illustrated empty states
- Call-to-action buttons
- Contextual help links
```

### B. Layout Components (to enhance)
```typescript
// src/components/layout/PageHeader.tsx
- Breadcrumb navigation
- Page title and description
- Primary action button
- Secondary actions dropdown

// src/components/layout/ContentGrid.tsx
- Responsive grid system
- Collapsible sections
- Drag-and-drop reordering (future)

// src/components/layout/FilterBar.tsx
- Filter chips with active state
- Filter presets
- Clear all filters

// src/components/layout/DataTableLayout.tsx
- Table with header, body, footer
- Bulk actions toolbar
- Column visibility toggle
```

### C. Business Components (to create)
```typescript
// src/components/business/RevenueChart.tsx
- Line/bar chart with Recharts
- Date range selector
- Comparison mode (vs previous period)

// src/components/business/AppointmentCard.tsx
- Appointment display with status
- Client/staff avatars
- Quick actions (check-in, cancel, reschedule)

// src/components/business/StaffAvatar.tsx
- Avatar with status indicator
- Role badge
- Performance metrics tooltip

// src/components/business/ServiceTag.tsx
- Service category badge
- Duration and price display
- Popularity indicator

// src/components/business/ClientSummary.tsx
- Client profile summary
- Visit history sparkline
- Preferences and notes
```

---

## II. API Integration Patterns

### A. API Client Enhancement
```typescript
// src/lib/api.ts - Enhanced version
export const api = {
  // Dashboard
  dashboard: {
    getOverview: () => apiFetch<DashboardData>('/api/analytics/overview'),
    getRevenueSummary: (period: string) => apiFetch<RevenueSummaryResponse>(`/api/revenue/summary?period=${period}`),
    getTodaySchedule: () => apiFetch<TodayAppointment[]>('/api/appointments/today'),
    getAlerts: () => apiFetch<Alert[]>('/api/owner/alerts'),
  },
  
  // Clients
  clients: {
    list: (params: ClientListParams) => apiFetch<PaginatedResponse<Client>>(`/api/clients?${queryString(params)}`),
    get: (id: string) => apiFetch<Client>(`/api/clients/${id}`),
    create: (data: CreateClientDTO) => apiFetch<Client>('/api/clients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateClientDTO) => apiFetch<Client>(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<void>(`/api/clients/${id}`, { method: 'DELETE' }),
    getHistory: (id: string) => apiFetch<ClientHistory>(`/api/clients/${id}/history`),
    search: (query: string) => apiFetch<Client[]>(`/api/clients/search?q=${encodeURIComponent(query)}`),
  },
  
  // Staff
  staff: {
    list: (params: StaffListParams) => apiFetch<PaginatedResponse<Staff>>(`/api/staff?${queryString(params)}`),
    get: (id: string) => apiFetch<Staff>(`/api/staff/${id}`),
    create: (data: CreateStaffDTO) => apiFetch<Staff>('/api/staff', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateStaffDTO) => apiFetch<Staff>(`/api/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    getSchedule: (id: string, date: string) => apiFetch<StaffSchedule>(`/api/staff/${id}/schedule?date=${date}`),
    getPerformance: (id: string, period: string) => apiFetch<StaffPerformance>(`/api/staff/${id}/performance?period=${period}`),
  },
  
  // Services
  services: {
    list: (params: ServiceListParams) => apiFetch<PaginatedResponse<Service>>(`/api/services?${queryString(params)}`),
    get: (id: string) => apiFetch<Service>(`/api/services/${id}`),
    create: (data: CreateServiceDTO) => apiFetch<Service>('/api/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateServiceDTO) => apiFetch<Service>(`/api/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<void>(`/api/services/${id}`, { method: 'DELETE' }),
    getCategories: () => apiFetch<ServiceCategory[]>('/api/services/categories'),
  },
  
  // Schedule
  schedule: {
    getAppointments: (params: AppointmentListParams) => apiFetch<PaginatedResponse<Appointment>>(`/api/appointments?${queryString(params)}`),
    getAppointment: (id: string) => apiFetch<Appointment>(`/api/appointments/${id}`),
    createAppointment: (data: CreateAppointmentDTO) => apiFetch<Appointment>('/api/appointments', { method: 'POST', body: JSON.stringify(data) }),
    updateAppointment: (id: string, data: UpdateAppointmentDTO) => apiFetch<Appointment>(`/api/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    cancelAppointment: (id: string, reason?: string) => apiFetch<Appointment>(`/api/appointments/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
    getAvailableSlots: (params: AvailableSlotsParams) => apiFetch<TimeSlot[]>(`/api/appointments/available-slots?${queryString(params)}`),
  },
  
  // Reports
  reports: {
    getRevenue: (params: ReportParams) => apiFetch<RevenueReport>(`/api/reports/revenue?${queryString(params)}`),
    getAppointments: (params: ReportParams) => apiFetch<AppointmentReport>(`/api/reports/appointments?${queryString(params)}`),
    getStaffPerformance: (params: ReportParams) => apiFetch<StaffPerformanceReport>(`/api/reports/staff-performance?${queryString(params)}`),
    getClientRetention: (params: ReportParams) => apiFetch<ClientRetentionReport>(`/api/reports/client-retention?${queryString(params)}`),
    export: (type: string, params: ReportParams) => apiFetch<Blob>(`/api/reports/export/${type}?${queryString(params)}`),
  },
  
  // Settings
  settings: {
    getSalon: () => apiFetch<SalonSettings>('/api/owner/settings'),
    updateSalon: (data: UpdateSalonSettingsDTO) => apiFetch<SalonSettings>('/api/owner/settings', { method: 'PATCH', body: JSON.stringify(data) }),
    getBusinessHours: () => apiFetch<BusinessHours[]>('/api/owner/business-hours'),
    updateBusinessHours: (data: BusinessHours[]) => apiFetch<BusinessHours[]>('/api/owner/business-hours', { method: 'PUT', body: JSON.stringify(data) }),
    getUsers: () => apiFetch<User[]>('/api/owner/users'),
    inviteUser: (data: InviteUserDTO) => apiFetch<User>('/api/owner/users/invite', { method: 'POST', body: JSON.stringify(data) }),
    updateUserRole: (userId: string, role: string) => apiFetch<User>(`/api/owner/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  },
};
```

### B. React Query Hooks
```typescript
// src/hooks/queries/useDashboard.ts
export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: api.dashboard.getOverview,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useRevenueSummary(period: string) {
  return useQuery({
    queryKey: ['dashboard', 'revenue', period],
    queryFn: () => api.dashboard.getRevenueSummary(period),
    enabled: !!period,
  });
}

// src/hooks/queries/useClients.ts
export function useClients(params: ClientListParams) {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => api.clients.list(params),
    keepPreviousData: true,
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => api.clients.get(id),
    enabled: !!id,
  });
}

// Similar hooks for staff, services, schedule, reports, settings
```

### C. Mutation Hooks
```typescript
// src/hooks/mutations/useClientMutations.ts
export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.clients.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create client: ${error.message}`);
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDTO }) => 
      api.clients.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['clients', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated successfully');
    },
  });
}
```

---

## III. State Management Approach

### A. Server State (React Query)
- **Data Fetching**: All API data managed by React Query
- **Caching**: Intelligent caching with stale-while-revalidate
- **Background Updates**: Automatic refetching on window focus
- **Optimistic Updates**: For mutations where appropriate
- **Error Handling**: Global error boundary + toast notifications

### B. Client State (Zustand)
```typescript
// src/stores/uiStore.ts
interface UIState {
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  commandPaletteOpen: boolean;
  activeFilters: Record<string, any>;
  
  // Actions
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleCommandPalette: () => void;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
}

// src/stores/formStore.ts
interface FormState {
  forms: Record<string, FormState>;
  
  // Actions
  setFormState: (formId: string, state: Partial<FormState>) => void;
  resetForm: (formId: string) => void;
  getFormState: (formId: string) => FormState;
}
```

### C. URL State (Next.js Router)
- **Filters**: Persisted in URL search params
- **Pagination**: Page and limit in URL
- **View State**: Active tab, selected items in URL
- **Deep Linking**: Shareable URLs with specific views

---

## IV. Page Implementation Plans

### Priority Order (Based on Business Value & Dependencies)
1. **Dashboard** (Highest - Immediate business insights)
2. **Schedule** (Critical - Daily operations)
3. **Clients** (Core CRM functionality)
4. **Staff** (Resource management)
5. **Services** (Revenue configuration)
6. **Reports** (Analytics & decision making)
7. **Settings** (Configuration - lowest priority)

---

### 1. /owner/dashboard - KPI Cockpit

#### Component Hierarchy
```
DashboardPage
├── PageHeader (title: "Dashboard", actions: [Refresh, Export])
├── KPIGrid
│   ├── KPICard (Revenue Today)
│   ├── KPICard (Appointments Today)
│   ├── KPICard (Active Clients)
│   └── KPICard (Average Ticket)
├── ContentGrid (2-column layout)
│   ├── RevenueChart (7-day trend)
│   ├── TodaySchedule
│   │   ├── ScheduleHeader
│   │   ├── AppointmentList
│   │   └── ScheduleFooter (View All)
│   ├── AlertsPanel
│   │   ├── AlertList
│   │   └── AlertFilters
│   └── StaffUtilization
│       ├── UtilizationChart
│       └── StaffList
└── RecentActivity
    ├── ActivityList
    └── ActivityFilters
```

#### Data Fetching Strategy
```typescript
// API Endpoints
GET /api/analytics/overview          // KPIs + today's schedule
GET /api/revenue/summary?period=7d   // Revenue chart data
GET /api/owner/alerts                // System alerts
GET /api/staff/utilization           // Staff utilization metrics
GET /api/activity/recent             // Recent activity feed

// React Query Hooks
const { data: overview, isLoading } = useDashboardOverview();
const { data: revenue } = useRevenueSummary('7d');
const { data: alerts } = useAlerts();
const { data: utilization } = useStaffUtilization();
const { data: activity } = useRecentActivity();
```

#### Key UI Patterns
- **KPI Cards**: Glass morphism cards with trend indicators
- **Revenue Chart**: Interactive line chart with date range selector
- **Today Schedule**: Timeline view with appointment cards
- **Alerts Panel**: Categorized alerts with priority indicators
- **Staff Utilization**: Progress bars with performance metrics
- **Recent Activity**: Timeline with activity type icons

#### TypeScript Interfaces Needed
```typescript
interface DashboardData {
  kpis: KPIData[];
  todaySchedule: TodayAppointment[];
  alerts: Alert[];
  revenueOverview: RevenueOverview;
  staffUtilization: StaffUtilization[];
  recentActivity: ActivityItem[];
}

interface KPIData {
  id: string;
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  format: 'currency' | 'number' | 'percentage';
  target?: number;
  sparkline?: number[];
}
```

#### Implementation Steps
1. Create KPI card component with design tokens
2. Implement revenue chart with Recharts
3. Build today schedule timeline
4. Create alerts panel with filtering
5. Add staff utilization visualization
6. Implement recent activity feed
7. Add refresh and export functionality

---

### 2. /owner/schedule - Calendar Management

#### Component Hierarchy
```
SchedulePage
├── PageHeader (title: "Schedule", actions: [New Appointment, Today, Navigation])
├── ScheduleToolbar
│   ├── ViewToggle (Day/Week/Month)
│   ├── DatePicker
│   ├── StaffFilter
│   └── ServiceFilter
├── ScheduleGrid
│   ├── TimeColumn (hourly slots)
│   ├── StaffColumns (one per staff member)
│   └── AppointmentBlocks (draggable/resizable)
├── AppointmentModal
│   ├── AppointmentForm
│   ├── ClientSelector
│   ├── ServiceSelector
│   ├── StaffSelector
│   └── TimeSlotPicker
└── Sidebar
    ├── TodaySummary
    ├── UpcomingAppointments
    └── QuickActions
```

#### Data Fetching Strategy
```typescript
// API Endpoints
GET /api/appointments?start_date={date}&end_date={date}&staff_ids={ids}
GET /api/staff?status=active
GET /api/services?is_active=true
GET /api/appointments/available-slots?service_id={id}&staff_id={id}&date={date}

// React Query Hooks
const { data: appointments } = useAppointments({
  startDate: selectedDate,
  endDate: endDate,
  staffIds: selectedStaff,
});
const { data: staff } = useStaff({ status: 'active' });
const { data: services } = useServices({ isActive: true });
```

#### Key UI Patterns
- **Calendar Grid**: CSS Grid with time slots and staff columns
- **Appointment Blocks**: Color-coded by service, draggable
- **Time Slot Picker**: Available slots visualization
- **Conflict Detection**: Visual indicators for scheduling conflicts
- **Drag & Drop**: React DnD for appointment rescheduling

#### TypeScript Interfaces Needed
```typescript
interface AppointmentBlock {
  id: string;
  clientId: string;
  clientName: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  color: string;
  notes?: string;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  staffId?: string;
}
```

#### Implementation Steps
1. Build calendar grid with time slots
2. Implement appointment blocks with drag-and-drop
3. Create appointment modal with form validation
4. Add staff and service filtering
5. Implement available slots API integration
6. Add conflict detection and resolution
7. Create today summary sidebar

---

### 3. /owner/clients - Client CRM

#### Component Hierarchy
```
ClientsPage
├── PageHeader (title: "Clients", actions: [Add Client, Import, Export])
├── ClientToolbar
│   ├── SearchInput
│   ├── StatusFilter (Active/Inactive/VIP)
│   ├── TagFilter
│   └── SortOptions
├── ClientGrid/List
│   ├── ClientCard (grid view)
│   └── ClientRow (list view)
├── ClientDetailPanel
│   ├── ClientHeader
│   ├── ClientInfo
│   ├── VisitHistory
│   ├── Preferences
│   └── Notes
└── ClientModal
    ├── ClientForm
    ├── PreferencesForm
    └── NotesEditor
```

#### Data Fetching Strategy
```typescript
// API Endpoints
GET /api/clients?page={page}&limit={limit}&search={query}&status={status}&tags={tags}
GET /api/clients/{id}
GET /api/clients/{id}/history
GET /api/clients/{id}/preferences
GET /api/clients/search?q={query}

// React Query Hooks
const { data: clients, isLoading } = useClients({
  page,
  limit,
  search,
  status,
  tags,
});
const { data: selectedClient } = useClient(selectedClientId);
const { data: clientHistory } = useClientHistory(selectedClientId);
```

#### Key UI Patterns
- **Data Table**: Sortable columns, bulk actions, pagination
- **Client Cards**: Grid view with key metrics
- **Detail Panel**: Slide-over panel with client details
- **Search**: Debounced search with recent searches
- **Tags**: Color-coded tag system
- **Visit History**: Timeline with service details

#### TypeScript Interfaces Needed
```typescript
interface ClientListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'vip';
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ClientWithMetrics extends Client {
  totalVisits: number;
  totalSpent: number;
  lastVisit?: string;
  averageSpend: number;
  favoriteServices: string[];
  favoriteStaff: string[];
}
```

#### Implementation Steps
1. Create data table with sorting and filtering
2. Implement client cards for grid view
3. Build client detail slide-over panel
4. Add search with autocomplete
5. Implement tag management system
6. Create visit history timeline
7. Add import/export functionality

---

### 4. /owner/staff - Staff Management

#### Component Hierarchy
```
StaffPage
├── PageHeader (title: "Staff", actions: [Add Staff, Schedule View])
├── StaffToolbar
│   ├── SearchInput
│   ├── RoleFilter
│   ├── StatusFilter
│   └── ViewToggle (Grid/List/Schedule)
├── StaffGrid/List
│   ├── StaffCard (grid view)
│   ├── StaffRow (list view)
│   └── StaffScheduleView
├── StaffDetailPanel
│   ├── StaffHeader
│   ├── StaffInfo
│   ├── ScheduleEditor
│   ├── PerformanceMetrics
│   └── ServicesOffered
└── StaffModal
    ├── StaffForm
    ├── ScheduleForm
    └── ServicesSelector
```

#### Data Fetching Strategy
```typescript
// API Endpoints
GET /api/staff?page={page}&limit={limit}&role={role}&status={status}
GET /api/staff/{id}
GET /api/staff/{id}/schedule?date={date}
GET /api/staff/{id}/performance?period={period}
GET /api/staff/{id}/services

// React Query Hooks
const { data: staff } = useStaff({
  page,
  limit,
  role,
  status,
});
const { data: selectedStaff } = useStaffMember(selectedStaffId);
const { data: staffSchedule } = useStaffSchedule(selectedStaffId, selectedDate);
const { data: performance } = useStaffPerformance(selectedStaffId, 'month');
```

#### Key UI Patterns
- **Staff Cards**: Profile cards with performance metrics
- **Schedule Editor**: Weekly schedule grid with time slots
- **Performance Dashboard**: Charts and metrics
- **Services Matrix**: Staff-service assignment grid
- **Role Badges**: Visual role indicators

#### TypeScript Interfaces Needed
```typescript
interface StaffWithMetrics extends Staff {
  todayAppointments: number;
  todayRevenue: number;
  utilization: number;
  rating: number;
  servicesCount: number;
}

interface StaffScheduleEditor {
  staffId: string;
  weekStart: string;
  days: ScheduleDay[];
}

interface ScheduleDay {
  date: string;
  slots: TimeSlot[];
  isWorking: boolean;
}
```

#### Implementation Steps
1. Create staff cards with performance metrics
2. Build schedule editor with drag-and-drop
3. Implement performance dashboard
4. Add services assignment matrix
5. Create staff detail panel
6. Add role and status management
7. Implement schedule templates

---

### 5. /owner/services - Service Catalog

#### Component Hierarchy
```
ServicesPage
├── PageHeader (title: "Services", actions: [Add Service, Import])
├── ServiceToolbar
│   ├── SearchInput
│   ├── CategoryFilter
│   ├── PriceRangeFilter
│   └── StatusFilter (Active/Inactive)
├── ServiceGrid/List
│   ├── ServiceCard (grid view)
│   ├── ServiceRow (list view)
│   └── CategoryGroup
├── ServiceDetailPanel
│   ├── ServiceHeader
│   ├── ServiceInfo
│   ├── PricingEditor
│   ├── StaffAssignments
│   └── ServiceHistory
└── ServiceModal
    ├── ServiceForm
    ├── PricingForm
    └── StaffSelector
```

#### Data Fetching Strategy
```typescript
// API Endpoints
GET /api/services?page={page}&limit={limit}&category={category}&price_min={min}&price_max={max}
GET /api/services/{id}
GET /api/services/categories
GET /api/services/{id}/staff
GET /api/services/{id}/history

// React Query Hooks
const { data: services } = useServices({
  page,
  limit,
  category,
  priceMin,
  priceMax,
});
const { data: categories } = useServiceCategories();
const { data: selectedService } = useService(selectedServiceId);
const { data: serviceStaff } = useServiceStaff(selectedServiceId);
```

#### Key UI Patterns
- **Service Cards**: Visual cards with pricing and duration
- **Category Tabs**: Tabbed interface by service category
- **Pricing Editor**: Dynamic pricing with discounts
- **Staff Assignment**: Drag-and-drop staff assignment
- **Service History**: Price change history

#### TypeScript Interfaces Needed
```typescript
interface ServiceWithMetrics extends Service {
  bookingsCount: number;
  revenue: number;
  averageRating: number;
  staffCount: number;
  popularity: number;
}

interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  serviceCount: number;
  color: string;
}

interface ServicePricing {
  basePrice: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  validFrom?: string;
  validTo?: string;
}
```

#### Implementation Steps
1. Create service cards with pricing display
2. Implement category filtering and tabs
3. Build pricing editor with discount support
4. Add staff assignment interface
5. Create service detail panel
6. Implement service history tracking
7. Add bulk import/export

---

### 6. /owner/reports - Analytics

#### Component Hierarchy
```
ReportsPage
├── PageHeader (title: "Reports", actions: [Export, Schedule Report])
├── ReportToolbar
│   ├── ReportTypeSelector
│   ├── DateRangePicker
│   ├── ComparisonToggle
│   └── GroupBySelector
├── ReportDashboard
│   ├── SummaryCards
│   ├── ChartsGrid
│   │   ├── RevenueChart
│   │   ├── AppointmentsChart
│   │   ├── StaffPerformanceChart
│   │   └── ClientRetentionChart
│   └── DataTable
└── ReportSidebar
    ├── SavedReports
    ├── ScheduledReports
    └── ExportOptions
```

#### Data Fetching Strategy
```typescript
// API Endpoints
GET /api/reports/revenue?start_date={start}&end_date={end}&group_by={group}
GET /api/reports/appointments?start_date={start}&end_date={end}&group_by={group}
GET /api/reports/staff-performance?start_date={start}&end_date={end}
GET /api/reports/client-retention?start_date={start}&end_date={end}
GET /api/reports/export/{type}?start_date={start}&end_date={end}

// React Query Hooks
const { data: revenueReport } = useRevenueReport({
  startDate,
  endDate,
  groupBy,
});
const { data: appointmentsReport } = useAppointmentsReport({
  startDate,
  endDate,
  groupBy,
});
const { data: staffReport } = useStaffPerformanceReport({
  startDate,
  endDate,
});
```

#### Key UI Patterns
- **Report Cards**: Summary metrics with comparisons
- **Interactive Charts**: Multiple chart types with drill-down
- **Data Tables**: Sortable, filterable data grids
- **Date Comparison**: Period-over-period comparison
- **Export Options**: Multiple format exports (CSV, PDF, Excel)

#### TypeScript Interfaces Needed
```typescript
interface ReportParams {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
  comparison?: boolean;
  staffIds?: string[];
  serviceIds?: string[];
}

interface RevenueReport {
  summary: RevenueSummary;
  chartData: ChartDataPoint[];
  breakdown: RevenueBreakdown[];
  comparison?: RevenueComparison;
}

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}
```

#### Implementation Steps
1. Create report type selector and date picker
2. Build summary cards with comparisons
3. Implement interactive charts with Recharts
4. Add data tables with sorting and filtering
5. Create export functionality
6. Add saved reports feature
7. Implement scheduled reports

---

### 7. /owner/settings - Configuration

#### Component Hierarchy
```
SettingsPage
├── PageHeader (title: "Settings", actions: [Save Changes])
├── SettingsTabs
│   ├── SalonInfo
│   │   ├── BasicInfoForm
│   │   ├── ContactInfoForm
│   │   └── BrandingForm
│   ├── BusinessHours
│   │   ├── WeeklySchedule
│   │   ├── HolidaySchedule
│   │   └── SpecialHours
│   ├── UserManagement
│   │   ├── UserList
│   │   ├── InviteUserForm
│   │   └── RolePermissions
│   ├── Notifications
│   │   ├── EmailSettings
│   │   ├── SMSSettings
│   │   └── PushSettings
│   └── Integrations
│       ├── PaymentGateways
│       ├── CalendarSync
│       └── MarketingTools
└── SettingsSidebar
    ├── QuickSettings
    └── SystemStatus
```

#### Data Fetching Strategy
```typescript
// API Endpoints
GET /api/owner/settings
GET /api/owner/business-hours
GET /api/owner/users
GET /api/owner/integrations
GET /api/owner/system-health

// React Query Hooks
const { data: salonSettings } = useSalonSettings();
const { data: businessHours } = useBusinessHours();
const { data: users } = useUsers();
const { data: integrations } = useIntegrations();
const { data: systemHealth } = useSystemHealth();
```

#### Key UI Patterns
- **Tabbed Interface**: Organized settings sections
- **Form Validation**: Real-time validation with error messages
- **Business Hours Editor**: Visual weekly schedule editor
- **User Management**: Role-based access control
- **Integration Cards**: Third-party service connections

#### TypeScript Interfaces Needed
```typescript
interface SalonSettings {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  timezone: string;
  currency: string;
  branding: BrandingSettings;
  notifications: NotificationSettings;
}

interface BusinessHours {
  dayOfWeek: number;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  breaks?: TimeSlot[];
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'staff';
  permissions: string[];
  lastLogin?: string;
  status: 'active' | 'inactive' | 'pending';
}
```

#### Implementation Steps
1. Create tabbed settings interface
2. Build salon info forms with validation
3. Implement business hours editor
4. Add user management with roles
5. Create notification settings
6. Build integrations management
7. Add system health monitoring

---

## V. Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- Set up React Query provider and hooks
- Create shared UI components (DataTable, KPICard, etc.)
- Implement API client enhancements
- Set up Zustand stores for UI state

### Phase 2: Core Pages (Week 3-5)
- Dashboard implementation
- Schedule implementation
- Clients implementation

### Phase 3: Supporting Pages (Week 6-7)
- Staff management
- Service catalog

### Phase 4: Analytics & Config (Week 8-9)
- Reports implementation
- Settings implementation

### Phase 5: Polish & Optimization (Week 10)
- Performance optimization
- Accessibility improvements
- Error handling refinement
- Documentation

---

## VI. Success Criteria

### Technical
- All pages use live API data (no mock data)
- React Query for all data fetching with proper caching
- TypeScript strict mode with no `any` types
- 90%+ test coverage for critical paths
- Lighthouse score > 90 for performance

### User Experience
- Page load time < 2 seconds
- Interactive elements respond within 100ms
- Consistent design language using design tokens
- Mobile-responsive layouts
- Keyboard navigation support

### Business
- All owner workflows supported
- Real-time data updates
- Export functionality for all reports
- Multi-user support with role-based access

---

## VII. Risk Mitigation

### Technical Risks
- **API Changes**: Use TypeScript interfaces for all API contracts
- **Performance**: Implement virtualization for large lists
- **Data Consistency**: Use optimistic updates with rollback

### User Experience Risks
- **Complexity**: Progressive disclosure of advanced features
- **Learning Curve**: Contextual help and onboarding
- **Mobile Usage**: Responsive design with touch-friendly controls

### Business Risks
- **Data Loss**: Regular backups and undo functionality
- **Downtime**: Graceful degradation when API is unavailable
- **Security**: Role-based access control and audit logging

