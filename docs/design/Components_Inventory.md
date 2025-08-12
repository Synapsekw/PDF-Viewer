# Components Inventory - Spectra AI

This document provides a comprehensive inventory of all UI components in the Spectra AI design system, including their variants, states, and usage guidelines.

## Table of Contents

1. [Base UI Components](#base-ui-components)
2. [Layout Components](#layout-components)
3. [Navigation Components](#navigation-components)
4. [Form Components](#form-components)
5. [Data Display Components](#data-display-components)
6. [Feedback Components](#feedback-components)
7. [PDF Components](#pdf-components)
8. [Analytics Components](#analytics-components)
9. [Admin Components](#admin-components)
10. [Feature Components](#feature-components)

## Base UI Components

### Button
**Location**: `src/components/ui/Button.tsx`

**Purpose**: Primary interactive element for actions

**Variants**:
- `primary` - Main CTA actions
- `secondary` - Secondary actions
- `text` - Text-only button
- `icon` - Icon-only button
- `glass` - Glassmorphic style

**Sizes**:
- `sm` - Small (32px height)
- `md` - Medium (40px height) - default
- `lg` - Large (48px height)

**States**:
- Default
- Hover
- Active/Pressed
- Disabled
- Loading

**Props**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'text' | 'icon' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isActive?: boolean;
  isLoading?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

**Usage**:
```tsx
<Button variant="primary" size="md" onClick={handleSubmit}>
  Save Changes
</Button>
```

### Card
**Location**: `src/components/ui/Card.tsx`

**Purpose**: Container for grouped content

**Variants**:
- `default` - Standard card with border
- `elevated` - Card with shadow
- `glass` - Glassmorphic card

**Props**:
```typescript
interface CardProps {
  variant?: 'default' | 'elevated' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

**Usage**:
```tsx
<Card variant="glass" padding="md">
  <CardHeader>Title</CardHeader>
  <CardContent>Content goes here</CardContent>
</Card>
```

### Badge
**Location**: `src/components/ui/Badge.tsx`

**Purpose**: Small label for status or category indication

**Variants**:
- `default` - Neutral gray
- `primary` - Blue accent
- `success` - Green
- `warning` - Yellow
- `error` - Red

**Sizes**:
- `sm` - Small text
- `md` - Default size

**Usage**:
```tsx
<Badge variant="success" size="sm">
  Active
</Badge>
```

### IconButton
**Location**: `src/components/ui/IconButton.tsx`

**Purpose**: Button containing only an icon

**Variants**:
- `ghost` - Transparent background
- `filled` - Solid background
- `outline` - Border only

**Sizes**:
- `sm` - 32px
- `md` - 40px
- `lg` - 48px

**Usage**:
```tsx
<IconButton variant="ghost" size="md" onClick={handleClose}>
  <X />
</IconButton>
```

### Input
**Location**: `src/components/ui/Input.tsx`

**Purpose**: Text input field

**Variants**:
- `default` - Standard input
- `glass` - Glassmorphic style

**States**:
- Default
- Focus
- Error
- Disabled

**Props**:
```typescript
interface InputProps {
  variant?: 'default' | 'glass';
  error?: boolean;
  label?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
```

### Tooltip
**Location**: `src/components/ui/Tooltip.tsx`

**Purpose**: Contextual information on hover

**Placement**:
- `top`
- `bottom`
- `left`
- `right`

**Usage**:
```tsx
<Tooltip content="Additional information" placement="top">
  <Button>Hover me</Button>
</Tooltip>
```

### Toast
**Location**: `src/components/ui/Toast.tsx`

**Purpose**: Temporary notification messages

**Types**:
- `success` - Green with checkmark
- `error` - Red with X
- `warning` - Yellow with alert
- `info` - Blue with info icon

**Features**:
- Auto-dismiss (configurable duration)
- Manual dismiss
- Action button support

## Layout Components

### AppShell
**Location**: `src/layout/AppShell.tsx`

**Purpose**: Main application layout wrapper

**Features**:
- Fixed sidebar
- Responsive drawer on mobile
- Content area with consistent padding

### GlassViewLayout
**Location**: `src/components/layout/GlassViewLayout.tsx`

**Purpose**: Glass morphism themed layout container

### Modal
**Location**: `src/components/Modal.tsx`

**Purpose**: Overlay dialog for focused content

**Sizes**:
- `sm` - 400px max-width
- `md` - 600px max-width
- `lg` - 800px max-width
- `full` - 90vw max-width

**Features**:
- Backdrop blur
- Close on escape/outside click
- Slide-up animation

## Navigation Components

### Sidebar
**Location**: `src/components/nav/Sidebar.tsx`

**Purpose**: Main navigation sidebar

**States**:
- Expanded (280px)
- Collapsed (72px)
- Mobile drawer

**Features**:
- Logo area
- Navigation sections
- User menu
- Collapse toggle

### NavItem
**Location**: `src/components/nav/NavItem.tsx`

**Purpose**: Individual navigation item

**States**:
- Default
- Hover
- Active
- Disabled

**Features**:
- Icon + label
- Badge support
- Nested items

### SidebarSection
**Location**: `src/components/nav/SidebarSection.tsx`

**Purpose**: Grouped navigation items

**Features**:
- Section title
- Collapsible
- Item grouping

## Form Components

### FileUpload
**Location**: `src/components/controls/FileUpload.tsx`

**Purpose**: File upload interface

**Features**:
- Drag and drop
- File validation
- Progress tracking
- Multiple file support

### UploadProgress
**Location**: `src/components/controls/UploadProgress.tsx`

**Purpose**: Upload progress indicator

**Features**:
- Progress bar
- File info
- Cancel option
- Success/error states

## Data Display Components

### KpiCard
**Location**: `src/components/dashboard/KpiCard.tsx`

**Purpose**: Key metric display card

**Features**:
- Large value display
- Trend indicator
- Sparkline chart
- Icon
- Comparison delta

**Usage**:
```tsx
<KpiCard
  title="Total Views"
  value={1234}
  icon={<Eye />}
  delta={{ value: 12.5, direction: 'up' }}
/>
```

### ViewsOverTime
**Location**: `src/components/dashboard/ViewsOverTime.tsx`

**Purpose**: Time series chart for view analytics

**Features**:
- Line chart
- Date range selector
- Responsive sizing
- Hover tooltips

### PageDropoffChart
**Location**: `src/components/dashboard/PageDropoffChart.tsx`

**Purpose**: Funnel visualization for page progression

### PageHeatmapPreview
**Location**: `src/components/dashboard/PageHeatmapPreview.tsx`

**Purpose**: Visual heatmap of user interactions

### TopPdfsBar
**Location**: `src/components/dashboard/TopPdfsBar.tsx`

**Purpose**: Bar chart of most viewed documents

### TopQuestionsTable
**Location**: `src/components/dashboard/TopQuestionsTable.tsx`

**Purpose**: Table of frequently asked questions

### WordCloud
**Location**: `src/components/dashboard/WordCloud.tsx`

**Purpose**: Visual representation of common terms

### RealtimeAnalytics
**Location**: `src/components/dashboard/RealtimeAnalytics.tsx`

**Purpose**: Live analytics dashboard

## Feedback Components

### WelcomeMessage
**Location**: `src/components/welcome/WelcomeMessage.tsx`

**Purpose**: Onboarding welcome screen

**Features**:
- Greeting text
- Quick actions
- Dismissible

### CloudUploadProgress
**Location**: `src/components/upload/CloudUploadProgress.tsx`

**Purpose**: Cloud sync progress indicator

## PDF Components

### PDFViewer
**Location**: `src/components/pdf/PDFViewer.tsx`

**Purpose**: Core PDF rendering component

**Features**:
- Page rendering
- Navigation controls
- Zoom controls
- Rotation
- Thumbnails
- Text selection

### PDFViewerWithFeatures
**Location**: `src/components/pdf/PDFViewerWithFeatures.tsx`

**Purpose**: Enhanced PDF viewer with plugins

**Additional Features**:
- Analytics integration
- AI assistant panel
- Snipping tool
- Export options

### ViewControls
**Location**: `src/components/controls/ViewControls.tsx`

**Purpose**: PDF viewer control bar

**Controls**:
- Zoom in/out
- Zoom dropdown
- Fit to page
- Rotate left/right
- Fullscreen toggle

### Navigation
**Location**: `src/components/controls/Navigation.tsx`

**Purpose**: Page navigation controls

**Features**:
- Previous/Next buttons
- Page number input
- Total pages display

## Analytics Components

### AnalyticsControls
**Location**: `src/components/controls/AnalyticsControls.tsx`

**Purpose**: Analytics feature controls

**Features**:
- Toggle analytics
- View options
- Export triggers

### ExportControls
**Location**: `src/components/controls/ExportControls.tsx`

**Purpose**: Data export interface

**Export Options**:
- JSON data
- HTML report
- PDF report

### SnippingControls
**Location**: `src/components/controls/SnippingControls.tsx`

**Purpose**: PDF snippet capture tool

**Features**:
- Region selection
- Copy to clipboard
- Download as image

## Admin Components

### AdminDashboard
**Location**: `src/components/admin/AdminDashboard.tsx`

**Purpose**: Administrative overview

**Sections**:
- User statistics
- System health
- Recent activity
- Quick actions

### AdminUserPanel
**Location**: `src/components/admin/AdminUserPanel.tsx`

**Purpose**: User management interface

**Features**:
- User list/table
- Search/filter
- Role management
- Actions (edit, disable)

### UserActivityMonitor
**Location**: `src/components/admin/UserActivityMonitor.tsx`

**Purpose**: Real-time user activity tracking

### SetupTools
**Location**: `src/components/admin/SetupTools.tsx`

**Purpose**: System configuration tools

## Feature Components

### AIAssistant
**Location**: `src/components/ai/AIAssistant.tsx`

**Purpose**: AI chat interface

**Features**:
- Chat messages
- Context awareness
- Suggested questions
- Collapsible panel

### BackupPanel
**Location**: `src/components/backup/BackupPanel.tsx`

**Purpose**: Data backup interface

**Features**:
- Backup creation
- Restore options
- Schedule management

### MigrationControlPanel
**Location**: `src/components/migration/MigrationControlPanel.tsx`

**Purpose**: Data migration tools

### Settings
**Location**: `src/components/settings/Settings.tsx`

**Purpose**: User settings interface

**Sections**:
- Profile settings
- Theme preferences
- Privacy controls
- Notifications

### SettingsModal
**Location**: `src/components/settings/SettingsModal.tsx`

**Purpose**: Settings in modal format

### LandingPage
**Location**: `src/components/LandingPage.tsx`

**Purpose**: Public landing page

**Features**:
- Hero section
- Feature highlights
- CTA buttons
- Responsive layout

## Component Status Guide

### Component States

All interactive components should handle these states:

1. **Default** - Normal resting state
2. **Hover** - Mouse over state
3. **Active** - Being clicked/pressed
4. **Focus** - Keyboard navigation focus
5. **Disabled** - Non-interactive state
6. **Loading** - Async operation in progress
7. **Error** - Error state with message
8. **Success** - Success feedback

### Component Composition

Components can be composed together:

```tsx
// Example: Dashboard card with data
<Card variant="glass">
  <CardHeader>
    <h3>Analytics Overview</h3>
    <IconButton variant="ghost" size="sm">
      <MoreVertical />
    </IconButton>
  </CardHeader>
  <CardContent>
    <KpiCard
      title="Total Views"
      value={1234}
      icon={<Eye />}
      delta={{ value: 12.5, direction: 'up' }}
    />
  </CardContent>
</Card>
```

### Responsive Behavior

All components should:
- Adapt to container width
- Support touch interactions
- Scale appropriately on mobile
- Maintain functionality across devices

### Accessibility Requirements

Every component must:
- Have proper ARIA labels
- Support keyboard navigation
- Maintain focus management
- Provide screen reader support
- Meet WCAG 2.1 AA standards

## Component Development Guidelines

### Creating New Components

1. **Check existing components** first
2. **Follow naming conventions**
3. **Include TypeScript types**
4. **Add proper documentation**
5. **Implement all required states**
6. **Test across browsers**
7. **Ensure accessibility**
8. **Add to component library**

### Component Structure

```tsx
// Component template
import React from 'react';
import { cn } from '@/utils/cn';

interface ComponentProps {
  // Props definition
}

export const Component: React.FC<ComponentProps> = ({
  // Props destructuring
}) => {
  // Component logic
  
  return (
    // JSX structure
  );
};

Component.displayName = 'Component';
```

---

**Note**: This inventory is a living document and should be updated as new components are added or existing ones are modified. Always refer to the actual component files for the most up-to-date implementation details.
