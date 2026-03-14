# SalonOS Owner PWA Mobile Responsiveness Plan

## Overview

This document defines the mobile responsiveness remediation plan for the **SalonOS Owner PWA** based on the 375x812 audit viewport (iPhone 12/13/14). The goal is to make all owner-facing pages usable, readable, and touch-friendly on mobile while preserving the high-density operational value of the desktop experience.

### Target Breakpoints

Based on the active design system:

- **Mobile:** `0px - 639px`
- **Tablet:** `640px - 1023px`
- **Desktop:** `1024px - 1279px`
- **Large Desktop:** `1280px+`

### Mobile Design Rules

Apply these rules consistently across all pages:

1. **Single-column first on mobile** for all KPI, chart, and content modules.
2. **Minimum 44px touch targets** for buttons, tabs, filters, chips, and segmented controls.
3. **Avoid horizontal overflow** except where intentional and controlled, such as tables or time-based schedule grids.
4. **Prefer stacked card layouts over dense tables** on mobile.
5. **Defer complexity** by collapsing secondary controls into drawers, sheets, or popovers.
6. **Keep headers sticky only when useful** and ensure sticky UI does not consume excessive vertical space.
7. **Use readable spacing**: `px-4`, `py-4`, `gap-4`, `space-y-4` as the default mobile rhythm.

---

## Shared Responsive Implementation Standards

### Recommended Tailwind Patterns

#### Page container

```tsx
className="mx-auto w-full max-w-screen-2xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8"
```

#### Section spacing

```tsx
className="space-y-4 sm:space-y-6 lg:space-y-8"
```

#### KPI grid

```tsx
className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
```

#### Two-column desktop content collapsing to mobile

```tsx
className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-6"
```

#### Three-column desktop content collapsing to mobile

```tsx
className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
```

#### Scroll wrapper for overflow modules

```tsx
className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
```

#### Card padding

```tsx
className="rounded-xl p-4 sm:p-5 lg:p-6"
```

#### Button group wrapping safely

```tsx
className="flex flex-wrap gap-2"
```

#### Mobile-safe input row

```tsx
className="flex flex-col gap-3 sm:flex-row sm:items-center"
```

#### Truncated text protection

```tsx
className="min-w-0 truncate"
```

---

## New Components Recommended

The following shared components should be created before or during page fixes to reduce duplication.

### 1. `ResponsiveStatGrid`
**Purpose:** Shared KPI/statistics wrapper for dashboard, clients, staff, services, and reports.

**Behavior:**
- Mobile: 1 column
- Small tablet: 2 columns
- Desktop: 4 columns

**Recommended classes:**
```tsx
className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
```

### 2. `MobileDataCardList`
**Purpose:** Replace wide desktop tables with stacked entity cards on mobile.

**Use on:** Clients, Staff, Services.

**Behavior:**
- Hidden on desktop table view
- Visible below `md` or `lg` depending on page density
- Shows key-value rows, status pill, and primary actions

**Recommended visibility classes:**
```tsx
className="block lg:hidden"
```

### 3. `DesktopTableWithMobileFallback`
**Purpose:** Standard pattern for responsive data presentation.

**Behavior:**
- Mobile: card list
- Desktop: table

### 4. `HorizontalFilterChips`
**Purpose:** Safe mobile filter control for category/status/staff/period selection.

**Behavior:**
- Allows horizontal scrolling when filters exceed viewport width
- Supports active state and touch-friendly chip sizing

**Recommended classes:**
```tsx
className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
```

### 5. `ResponsiveSegmentedControl`
**Purpose:** Day/Week toggle, period selector, and similar compact control groups.

**Behavior:**
- Mobile: full-width 2-column segmented buttons
- Desktop: inline auto-width

**Recommended classes:**
```tsx
className="grid grid-cols-2 gap-2 sm:inline-flex sm:w-auto"
```

### 6. `ResponsiveChartCard`
**Purpose:** Standardize chart containers to prevent clipping and unreadable axes.

**Behavior:**
- Fixed min height on mobile
- Internal padding reduced on mobile
- Optional horizontal scrolling for data-dense charts

**Recommended classes:**
```tsx
className="rounded-xl p-4 sm:p-5"
```
with chart area:
```tsx
className="h-[240px] sm:h-[280px] lg:h-[320px]"
```

### 7. `FormStack`
**Purpose:** Shared responsive settings form layout.

**Behavior:**
- Mobile: vertical label/input stack
- Desktop: 2-column label-content layout

**Recommended classes:**
```tsx
className="grid grid-cols-1 gap-2 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6"
```

---

## Page-by-Page Fix Plan

---

## 1. Dashboard Page

### Issues
- KPI cards may not stack properly on mobile
- Weekly revenue chart may be too wide
- AI insight cards may overflow if rendered in rows
- Today's schedule items may be cramped

### Specific fixes

#### KPI Cards
- Convert any `grid-cols-2`, `grid-cols-3`, or `grid-cols-4` mobile default to a mobile-first single-column layout.
- Preserve 2-column layout only from `sm` upward if card content is short enough.
- Ensure KPI cards have consistent internal spacing and no clipped trend indicators.

**Recommended Tailwind:**
```tsx
className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
```

For each KPI card:
```tsx
className="min-w-0 rounded-xl p-4 sm:p-5"
```

#### Weekly Revenue Chart
- Move chart into a dedicated responsive chart card.
- Reduce axis label density on mobile.
- Shorten labels, rotate labels only if absolutely necessary.
- If chart library supports responsive containers, enforce width `100%` and mobile height reduction.
- If still dense, switch mobile to simplified 7-point sparkline or bar chart summary.

**Recommended Tailwind:**
```tsx
className="w-full overflow-hidden rounded-xl"
```
Chart wrapper:
```tsx
className="h-[240px] sm:h-[280px] lg:h-[320px]"
```

#### AI Insights Cards
- Stack cards vertically on mobile instead of rendering side by side.
- Limit each insight card to a concise summary and one primary action.
- Move secondary metadata into collapsible details.

**Recommended Tailwind:**
```tsx
className="grid grid-cols-1 gap-3 xl:grid-cols-2"
```

#### Today's Schedule
- Convert dense multi-column list rows into stacked appointment cards on mobile.
- Show only time, client, service, and staff/status in the first view.
- Collapse notes and secondary actions into a chevron expansion or overflow menu.

**Recommended Tailwind:**
```tsx
className="space-y-3"
```
Appointment card:
```tsx
className="rounded-xl p-4"
```
Header row:
```tsx
className="flex items-start justify-between gap-3"
```

### New components needed
- `ResponsiveStatGrid`
- `ResponsiveChartCard`
- `MobileScheduleCard`
- `InsightCardStack`

### Estimated effort
- **Medium**: `4-6 hours`

### Priority
- **P1**

---

## 2. Schedule Page

### Issues
- Calendar grid may not be responsive
- Staff filter may be too narrow
- Day/Week buttons may be cramped
- Time column may be too narrow

### Specific fixes

#### Calendar View
- Do not attempt to fully compress the desktop week grid into the 375px viewport without adaptation.
- Implement a true mobile schedule mode:
  - **Default mobile view:** agenda/day list
  - **Optional alternate:** horizontally scrollable day timeline
- Hide non-essential columns and compress staff lanes only on larger breakpoints.
- Prefer a vertically stacked agenda list for mobile for immediate usability.

**Recommended Tailwind:**
Desktop calendar container:
```tsx
className="hidden lg:block"
```
Mobile agenda container:
```tsx
className="block lg:hidden space-y-3"
```

#### Staff Filter
- Make filter full width on mobile.
- If multiple filters exist, stack them.
- Consider converting to a bottom sheet selector if option list is long.

**Recommended Tailwind:**
```tsx
className="w-full sm:w-[220px]"
```
Filter row:
```tsx
className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
```

#### Day/Week Buttons
- Replace cramped inline buttons with segmented control.
- Ensure each button is at least 44px high.

**Recommended Tailwind:**
```tsx
className="grid grid-cols-2 gap-2 sm:inline-flex"
```
Button:
```tsx
className="min-h-11 w-full px-4"
```

#### Time Column
- Prevent unreadably narrow time gutter.
- If using mobile agenda, time appears as leading label inside each card instead of as a dedicated column.
- If maintaining a horizontal timeline on mobile, set a fixed width for time column and allow horizontal scroll for the rest.

**Recommended Tailwind:**
```tsx
className="w-16 shrink-0"
```
Timeline wrapper:
```tsx
className="overflow-x-auto"
```

### New components needed
- `MobileAgendaView`
- `ResponsiveSegmentedControl`
- `ScheduleFilterBar`
- `TimelineScrollShell`

### Estimated effort
- **High**: `8-12 hours`

### Priority
- **P0**

**Reason:** The schedule page is the most operationally critical page and desktop-style calendar compression tends to fail badly on mobile.

---

## 3. Clients Page

### Issues
- 6-column data table will overflow
- Filter buttons may wrap awkwardly
- KPI cards may not stack properly

### Specific fixes

#### Data Table
- Replace mobile table view with stacked client cards.
- Keep desktop table from `lg` upward.
- Each mobile client card should contain:
  - client name
  - phone/email summary
  - visit count / last visit
  - lifetime value or tag summary
  - primary action button
- Preserve sorting/filtering at the data layer, not the UI layout layer.

**Recommended Tailwind:**
Desktop table:
```tsx
className="hidden lg:block"
```
Mobile card list:
```tsx
className="space-y-3 lg:hidden"
```

#### Filter Buttons
- Convert filter row to either:
  - wrapping chip group, or
  - horizontal scroll chips if there are many filters.
- Promote the most important filter to visible state and move advanced filters into a drawer.

**Recommended Tailwind:**
```tsx
className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap"
```

#### KPI Cards
- Use shared `ResponsiveStatGrid`.
- On mobile show 1 per row; allow 2-up only if the content is very short.

**Recommended Tailwind:**
```tsx
className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
```

### New components needed
- `MobileDataCardList`
- `ClientMobileCard`
- `HorizontalFilterChips`
- `ResponsiveStatGrid`

### Estimated effort
- **Medium**: `5-7 hours`

### Priority
- **P0**

**Reason:** Wide client tables are very likely unusable at 375px and directly affect customer lookup workflows.

---

## 4. Staff Page

### Issues
- 6-column data table will overflow
- KPI cards may not stack properly
- Action buttons may be cramped

### Specific fixes

#### Data Table
- Follow the same responsive strategy as Clients.
- Create mobile staff cards showing:
  - staff name
  - role
  - schedule/availability snippet
  - status
  - primary actions

**Recommended Tailwind:**
Desktop table:
```tsx
className="hidden lg:block"
```
Mobile list:
```tsx
className="space-y-3 lg:hidden"
```

#### KPI Cards
- Reuse `ResponsiveStatGrid`.

#### Action Buttons
- Convert tight inline actions into:
  - one primary button visible
  - one overflow menu for secondary actions
- Stack buttons vertically on mobile if two primary actions are required.

**Recommended Tailwind:**
Actions container:
```tsx
className="flex flex-col gap-2 sm:flex-row"
```
Buttons:
```tsx
className="min-h-11 w-full sm:w-auto"
```

### New components needed
- `StaffMobileCard`
- `ActionOverflowMenu`
- `ResponsiveStatGrid`

### Estimated effort
- **Medium**: `4-6 hours`

### Priority
- **P1**

---

## 5. Services Page

### Issues
- Service list may not stack well
- KPI cards may not stack properly
- Category filter may be cramped

### Specific fixes

#### Service List
- If currently table-based, replace with stacked service cards on mobile.
- Each card should show:
  - service name
  - category
  - duration
  - price
  - availability/status
  - quick actions
- If currently grid-based, ensure cards render 1 column on mobile.

**Recommended Tailwind:**
```tsx
className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
```
If table fallback needed:
```tsx
className="hidden lg:block"
```
with mobile cards:
```tsx
className="space-y-3 lg:hidden"
```

#### KPI Cards
- Use shared responsive stat grid.

#### Category Filter
- Convert to horizontal chips or full-width select on mobile.
- If categories are many, a select is preferable to a multi-row chip wrap.

**Recommended Tailwind:**
Select:
```tsx
className="w-full sm:w-[220px]"
```
Chip row:
```tsx
className="flex gap-2 overflow-x-auto pb-1"
```

### New components needed
- `ServiceMobileCard`
- `HorizontalFilterChips`
- `ResponsiveStatGrid`

### Estimated effort
- **Medium**: `4-6 hours`

### Priority
- **P2**

---

## 6. Reports Page

### Issues
- Revenue chart may not be responsive
- Statistics cards may not stack properly
- Period selector may be cramped

### Specific fixes

#### Revenue Chart
- Wrap charts in a responsive chart container with explicit height.
- Simplify chart chrome on mobile:
  - fewer ticks
  - abbreviated axis labels
  - legend moved below or into dropdown
  - reduced side padding
- For multi-series charts, allow series toggle chips instead of showing all lines at once.

**Recommended Tailwind:**
Chart card:
```tsx
className="rounded-xl p-4 sm:p-5"
```
Chart area:
```tsx
className="h-[240px] sm:h-[280px] lg:h-[340px]"
```

#### Statistics Cards
- Use single column mobile-first stat grid.

#### Period Selector
- Convert compact selector row into either:
  - segmented control for 2-3 options, or
  - full-width select/dropdown for many options.
- If date range + compare controls are present, stack them.

**Recommended Tailwind:**
Selector row:
```tsx
className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
```
Segmented control:
```tsx
className="grid grid-cols-2 gap-2 sm:inline-flex"
```

### New components needed
- `ResponsiveChartCard`
- `ResponsiveSegmentedControl`
- `ResponsiveStatGrid`

### Estimated effort
- **Medium**: `5-7 hours`

### Priority
- **P1**

---

## 7. Settings Page

### Issues
- Two-column form layout should stack on mobile
- Navigation tabs may be cramped
- Profile photo upload may not be responsive

### Specific fixes

#### Form Layout
- Convert label/input desktop rows into mobile vertical stacks.
- Keep desktop 2-column form only on `lg` and above.
- Ensure long labels wrap cleanly and helper text sits below inputs.

**Recommended Tailwind:**
Form row:
```tsx
className="grid grid-cols-1 gap-2 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6"
```
Input group:
```tsx
className="min-w-0 space-y-2"
```

#### Navigation Tabs
- If tabs exceed width, switch from fixed-width tab row to:
  - horizontal scroll tabs, or
  - select/dropdown on mobile if tab count is high.
- Make tab labels concise.

**Recommended Tailwind:**
Scrollable tabs:
```tsx
className="flex gap-2 overflow-x-auto pb-1"
```
Tab trigger:
```tsx
className="min-h-11 whitespace-nowrap px-4"
```

#### Profile Photo Upload
- Stack preview and controls vertically on mobile.
- Constrain image preview size and center align.
- Ensure upload/remove buttons are full width on mobile.

**Recommended Tailwind:**
Upload shell:
```tsx
className="flex flex-col gap-4 sm:flex-row sm:items-center"
```
Preview:
```tsx
className="h-24 w-24 shrink-0 self-center sm:self-auto"
```
Buttons:
```tsx
className="w-full sm:w-auto"
```

### New components needed
- `FormStack`
- `ScrollableTabs`
- `ResponsiveImageUpload`

### Estimated effort
- **Low to Medium**: `3-5 hours`

### Priority
- **P1**

---

## Global Implementation Order

### Phase 1 — Shared foundation
Implement shared primitives first to reduce rework.

1. `ResponsiveStatGrid`
2. `MobileDataCardList`
3. `ResponsiveSegmentedControl`
4. `HorizontalFilterChips`
5. `ResponsiveChartCard`
6. `FormStack`

**Estimated effort:** `6-8 hours`

### Phase 2 — Highest-risk operational pages
1. **Schedule Page**
2. **Clients Page**

**Estimated effort:** `13-19 hours`

### Phase 3 — High-value supporting pages
3. **Dashboard Page**
4. **Staff Page**
5. **Reports Page**
6. **Settings Page**

**Estimated effort:** `16-24 hours`

### Phase 4 — Lower-risk cleanup
7. **Services Page**
8. Cross-page polish, spacing consistency, and mobile QA pass

**Estimated effort:** `6-10 hours`

---

## Final Priority Order

| Priority | Page | Reason |
|---|---|---|
| P0 | Schedule | Most operationally critical; desktop calendar patterns break hardest on mobile |
| P0 | Clients | 6-column data table likely unusable on mobile; core lookup workflow |
| P1 | Dashboard | Executive overview must remain legible and actionable |
| P1 | Staff | Table/actions need mobile-safe workflows |
| P1 | Reports | Charts and period controls need responsive simplification |
| P1 | Settings | Form usability must be reliable on mobile |
| P2 | Services | Lower workflow urgency than schedule/clients/staff |

---

## Estimated Total Effort

| Scope | Estimate |
|---|---|
| Shared components/foundation | 6-8 hours |
| Page-level fixes | 33-49 hours |
| QA and polish | 4-6 hours |
| **Total** | **43-63 hours** |

---

## QA Acceptance Criteria

Each page should pass the following checks at **375x812**, **390x844**, and **640x960**:

- No unintended horizontal overflow
- All primary actions reachable with one hand where practical
- All controls at least 44px tall
- No clipped text in cards, buttons, tabs, filters, or table replacements
- Tables replaced or safely adapted for mobile
- Charts readable without pinch-zoom
- Forms fully usable without side-scrolling
- Tab, chip, and button groups wrap or scroll intentionally
- Visual hierarchy preserved with clear section separation

---

## Recommended Implementation Notes

- Prefer `lg` as the switch point from mobile card layouts to desktop tables for dense owner data screens.
- Avoid forcing desktop parity on mobile when the content model differs; mobile should prioritize actionability over density.
- Use consistent mobile page rhythm: `px-4`, `py-4`, `gap-4`, `space-y-4`.
- For charts and calendars, **responsive redesign** is better than simple shrink-to-fit.
- For all list-heavy pages, introduce mobile summary cards with only the most important data visible by default.

---

## Suggested Next Execution Sequence

1. Build shared responsive primitives
2. Optimize Schedule page
3. Optimize Clients page
4. Optimize Dashboard page
5. Optimize Staff page
6. Optimize Reports page
7. Optimize Settings page
8. Optimize Services page
9. Run final mobile QA sweep with screenshots and viewport verification

