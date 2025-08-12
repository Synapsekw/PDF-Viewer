# Page Blueprints - Spectra AI

This document provides detailed blueprints for all pages in the Spectra AI application, including layout structures, component placement, and interaction patterns.

## Table of Contents

1. [Overview](#overview)
2. [Layout System](#layout-system)
3. [Page Blueprints](#page-blueprints)
   - [Dashboard](#dashboard-page)
   - [Library](#library-page)
   - [PDF Viewer](#pdf-viewer-page)
   - [Reports](#reports-page)
   - [Admin](#admin-page)
   - [User Settings](#user-settings-page)
   - [Public Landing](#public-landing-page)
   - [Public Viewer](#public-viewer-page)
4. [Component Layout Guidelines](#component-layout-guidelines)

## Overview

All pages in Spectra AI follow a consistent layout pattern with a fixed sidebar navigation and a content area that adapts to different screen sizes. The design emphasizes a dark, glassmorphic aesthetic with subtle animations and clear information hierarchy.

## Layout System

### Base Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                          App Shell                          │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│            │                 Content Area                   │
│  Sidebar   │                                                │
│            │  ┌──────────────────────────────────────────┐  │
│  280px     │  │            Page Content                  │  │
│  (72px     │  │                                          │  │
│  collapsed)│  │                                          │  │
│            │  │                                          │  │
│            │  └──────────────────────────────────────────┘  │
│            │                                                │
└────────────┴────────────────────────────────────────────────┘
```

### Responsive Breakpoints

- **Mobile**: < 768px (sidebar as drawer)
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px - 1536px
- **Wide**: > 1536px

## Page Blueprints

### Dashboard Page

```
┌────────────────────────────────────────────────────────────┐
│                      Dashboard Header                       │
│  "Analytics Dashboard"                     Date Range Picker│
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────┐ │
│  │ Total Views │ │   Unique    │ │  Avg. Time  │ │ Down │ │
│  │   KPI Card  │ │  Viewers    │ │  KPI Card   │ │loads │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────┘ │
│                                                            │
│  ┌───────────────────────────────┐ ┌────────────────────┐  │
│  │                               │ │                    │  │
│  │     Views Over Time           │ │   Top PDFs Bar     │  │
│  │     (Line Chart)              │ │   (Bar Chart)      │  │
│  │                               │ │                    │  │
│  └───────────────────────────────┘ └────────────────────┘  │
│                                                            │
│  ┌───────────────────────────────┐ ┌────────────────────┐  │
│  │                               │ │                    │  │
│  │    Page Dropoff Chart         │ │  Page Heatmap      │  │
│  │    (Funnel Chart)             │ │   Preview          │  │
│  │                               │ │                    │  │
│  └───────────────────────────────┘ └────────────────────┘  │
│                                                            │
│  ┌───────────────────────────────┐ ┌────────────────────┐  │
│  │                               │ │                    │  │
│  │   Top Questions Table         │ │   Word Cloud       │  │
│  │                               │ │                    │  │
│  └───────────────────────────────┘ └────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Grid**: 12-column grid with 24px gutters
**Layout**: 2-column layout for charts (7:5 ratio on desktop)

### Library Page

```
┌────────────────────────────────────────────────────────────┐
│                      Library Header                         │
│  "My Library"                 [Upload] [Grid/List Toggle]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │          Search & Filter Bar                        │   │
│  │  [Search...] [Sort ▼] [Filter] [Date Range]        │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                                                     │  │
│  │              Drop Zone (Drag & Drop)                │  │
│  │         "Drop PDFs here or click to upload"         │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  Document Grid (Responsive)                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │          │ │          │ │          │ │          │   │
│  │   PDF    │ │   PDF    │ │   PDF    │ │   PDF    │   │
│  │  Card    │ │  Card    │ │  Card    │ │  Card    │   │
│  │          │ │          │ │          │ │          │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │          │ │          │ │          │ │          │   │
│  │   PDF    │ │   PDF    │ │   PDF    │ │   PDF    │   │
│  │  Card    │ │  Card    │ │  Card    │ │  Card    │   │
│  │          │ │          │ │          │ │          │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Grid**: Flexible grid (auto-fit, minmax(280px, 1fr))
**Spacing**: 24px gap between cards

### PDF Viewer Page

```
┌────────────────────────────────────────────────────────────┐
│                     Viewer Header                          │
│ [Back] Document.pdf    [Zoom][Rotate][Fit][Share][Export] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────┬────────────────────────────────┬──────────┐  │
│  │         │                                │          │  │
│  │  Thumb  │                                │    AI    │  │
│  │  nails  │         PDF Canvas             │ Assistant│  │
│  │  Panel  │                                │   Panel  │  │
│  │         │                                │          │  │
│  │ (Collap │                                │ (Collap  │  │
│  │  sible) │                                │  sible)  │  │
│  │         │                                │          │  │
│  │         │                                │          │  │
│  │         │                                │          │  │
│  └─────────┴────────────────────────────────┴──────────┘  │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │          Navigation Controls                        │   │
│  │  [◀ Prev] Page 1 of 10 [Next ▶] [Jump to page]    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Layout**: 3-panel layout with collapsible side panels
**Widths**: 
- Thumbnails: 200px (collapsed: 0)
- AI Panel: 320px (collapsed: 0)
- Canvas: Flexible

### Reports Page

```
┌────────────────────────────────────────────────────────────┐
│                      Reports Header                         │
│  "Analytics Reports"              [Generate] [Export]       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │                Report Filters                       │   │
│  │  [Document ▼] [Date Range] [Metrics] [Group By]    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │                                                    │   │
│  │              Report Summary Cards                 │   │
│  │  [Sessions] [Page Views] [Avg Duration] [Bounce] │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │                                                    │   │
│  │           Detailed Analytics Charts               │   │
│  │                                                    │   │
│  │  - User Flow Visualization                        │   │
│  │  - Engagement Heatmap                             │   │
│  │  - Time Series Analysis                           │   │
│  │  - Page-by-Page Breakdown                         │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │                                                    │   │
│  │              Report Table View                    │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Admin Page

```
┌────────────────────────────────────────────────────────────┐
│                      Admin Header                          │
│  "System Administration"                    [System Health] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                  Admin Navigation                    │  │
│  │  [Users] [Roles] [Analytics] [Backup] [Migration]   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                                                     │  │
│  │                 User Management Table               │  │
│  │                                                     │  │
│  │  Name      Email         Role    Status   Actions  │  │
│  │  ─────────────────────────────────────────────────  │  │
│  │  John Doe  john@ex.com   User    Active   [•••]    │  │
│  │  Jane Doe  jane@ex.com   Admin   Active   [•••]    │  │
│  │                                                     │  │
│  │  [◀ Prev] Page 1 of 10 [Next ▶]                   │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                                                     │  │
│  │              System Activity Monitor                │  │
│  │                                                     │  │
│  │  - Recent User Activities                           │  │
│  │  - System Performance Metrics                       │  │
│  │  - Error Logs                                       │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### User Settings Page

```
┌────────────────────────────────────────────────────────────┐
│                    Settings Header                         │
│  "User Settings"                              [Save]       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                                                     │  │
│  │                 Profile Settings                    │  │
│  │                                                     │  │
│  │  Display Name   [_________________]                │  │
│  │  Email          [_________________] (read-only)    │  │
│  │  Profile Photo  [Upload Photo]                     │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                                                     │  │
│  │                Appearance Settings                  │  │
│  │                                                     │  │
│  │  Theme          [◉ Dark] [○ Light] [○ System]      │  │
│  │  Language       [English ▼]                         │  │
│  │  Date Format    [MM/DD/YYYY ▼]                     │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                                                     │  │
│  │                 Privacy Settings                    │  │
│  │                                                     │  │
│  │  Analytics      [✓] Enable analytics collection     │  │
│  │  Notifications  [✓] Email notifications             │  │
│  │  Data Export    [Export My Data]                    │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Public Landing Page

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                    Spectra AI Logo                         │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                                                     │  │
│  │              Document Preview Card                  │  │
│  │                                                     │  │
│  │    📄 Document Title                                │  │
│  │    Shared by: Owner Name                            │  │
│  │    Pages: 42 | Size: 2.3 MB                         │  │
│  │                                                     │  │
│  │    "This document contains..."                      │  │
│  │                                                     │  │
│  │              [Open Document]                         │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                                                     │  │
│  │          Powered by Spectra AI                      │  │
│  │     Advanced PDF Analytics & Viewing Platform       │  │
│  │                [Learn More]                         │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Public Viewer Page

```
┌────────────────────────────────────────────────────────────┐
│                  Minimal Header                            │
│  Document.pdf                    [Zoom][Download][Help]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                                                     │  │
│  │                                                     │  │
│  │                   PDF Canvas                        │  │
│  │               (Full Screen View)                    │  │
│  │                                                     │  │
│  │                                                     │  │
│  │                                                     │  │
│  │                                                     │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │       [◀ Prev] Page 1 of 10 [Next ▶]               │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  Powered by Spectra AI                                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Component Layout Guidelines

### Spacing System
- **Base unit**: 8px
- **Component spacing**: 16px, 24px, 32px
- **Section spacing**: 48px, 64px
- **Page margins**: 24px (mobile: 16px)

### Container Widths
- **Max content width**: 1536px
- **Reading width**: 720px (for text-heavy content)
- **Card min-width**: 280px
- **Modal max-width**: 600px

### Component Heights
- **Header**: 64px
- **Navigation items**: 48px
- **Input fields**: 40px
- **Buttons**: 40px (regular), 32px (small), 48px (large)
- **Cards**: Variable (min-height: 200px for data cards)

### Grid Guidelines
- **Columns**: 12 (desktop), 6 (tablet), 4 (mobile)
- **Gutters**: 24px (desktop), 16px (mobile)
- **Margins**: Equal to gutters

### Responsive Behavior
1. **Stack on mobile**: Multi-column layouts stack vertically
2. **Hide secondary**: Non-essential panels collapse on smaller screens
3. **Drawer navigation**: Sidebar becomes drawer on mobile
4. **Touch targets**: Minimum 44x44px on touch devices
5. **Flexible grids**: Use CSS Grid auto-fit for card layouts

### Z-Index Layers
1. **Base content**: 0
2. **Sticky elements**: 10
3. **Overlays**: 20
4. **Drawers**: 30
5. **Modals**: 40
6. **Tooltips**: 50
7. **Notifications**: 60

---

**Note**: These blueprints serve as a guide for implementing consistent layouts across the Spectra AI application. Always consider responsive design and accessibility when implementing these layouts.
