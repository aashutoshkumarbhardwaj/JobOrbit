# Loading Skeletons Implementation

## Overview
This document describes the comprehensive loading skeleton implementation across the JobTracker application. Loading skeletons provide visual feedback to users while data is being fetched, improving perceived performance and user experience.

## Implementation Details

### 1. Core Skeleton Component
**Location:** `src/components/ui/skeleton.tsx`

The base skeleton component uses Tailwind CSS animations:
- `animate-pulse` for the pulsing effect
- `bg-muted` for consistent theming
- Fully customizable via className prop

### 2. Reusable Skeleton Components
**Location:** `src/components/ui/loading-skeletons.tsx`

Created specialized skeleton components for different UI patterns:

#### Dashboard Skeletons
- **StatCardSkeleton**: Mimics stat card layout with icon, value, and label
- **WeeklyChartSkeleton**: Shows animated bar chart placeholder with varying heights
- **ActivityCardSkeleton**: Displays 4 activity items with company logos and status badges

#### Board/Kanban Skeletons
- **KanbanColumnSkeleton**: Single column with header and 3 card placeholders
- **KanbanBoardSkeleton**: Full board view with 5 columns

#### Table Skeletons
- **TableRowSkeleton**: Single table row with all columns
- **TableSkeleton**: Complete table with customizable row count (default: 5)

#### Calendar Skeletons
- **CalendarSkeleton**: Full calendar grid with 42 days and random event placeholders

#### Landing Page Skeletons
- **LandingStatsSkeleton**: 3-column stats grid
- **TestimonialCardSkeleton**: Testimonial card with avatar and text

#### Generic Skeletons
- **PageLoadingSkeleton**: Full page layout with header, stats, and content

## Pages Updated

### 1. Dashboard (`src/pages/Dashboard.tsx`)
**Loading States:**
- Header skeleton (title + description)
- Action buttons skeleton
- 4 stat cards
- Weekly chart with animated bars
- Activity feed with 4 items

**Trigger:** Shows when `authLoading || isLoading` is true

### 2. Board (`src/pages/Board.tsx`)
**Loading States:**
- Header skeleton
- View toggle buttons
- Toolbar (search + filters)
- Kanban board (5 columns with cards) OR Table view (8 rows)

**Trigger:** Shows when `authLoading || isLoading` is true

### 3. Applications (`src/pages/Applications.tsx`)
**Loading States:**
- Header skeleton
- Search bar and filter buttons
- Status filter pills (6 pills)
- Table with 10 rows

**Trigger:** Shows when `authLoading || isLoading` is true

### 4. Calendar (`src/pages/Calendar.tsx`)
**Loading States:**
- Header skeleton
- Action buttons
- Full calendar grid with 42 days
- Random event placeholders for realism

**Trigger:** Shows when `authLoading || isLoading` is true

### 5. Landing (`src/pages/Landing.tsx`)
**Loading States:**
- Stats section: 3 stat cards
- Testimonials section: 3 testimonial cards

**Trigger:** Shows when `statsLoading` or `testimonialsLoading` is true

## Component-Level Loading

### WeeklyChart Component
**Location:** `src/components/dashboard/WeeklyChart.tsx`

Added `isLoading` prop that shows:
- Chart header skeleton
- 7 animated bars with varying heights
- Day labels

### ActivityCard Component
**Location:** `src/components/dashboard/ActivityCard.tsx`

Added `isLoading` prop that shows:
- Header skeleton
- 4 activity items with company logo, text, and badge placeholders

## Design Principles

### 1. Content-Aware Skeletons
Each skeleton matches the actual content layout:
- Same dimensions and spacing
- Similar visual hierarchy
- Matching border radius and styling

### 2. Progressive Loading
Skeletons appear immediately while data loads:
- No blank screens
- Smooth transitions
- Maintains layout stability

### 3. Realistic Animations
- Pulse animation for shimmer effect
- Varying heights in charts for realism
- Staggered animations where appropriate

### 4. Consistent Theming
All skeletons use:
- `bg-muted` for background color
- `rounded-md` or matching border radius
- Consistent spacing and padding

## Usage Examples

### Basic Usage
```tsx
import { Skeleton } from "@/components/ui/skeleton";

// Simple skeleton
<Skeleton className="h-4 w-32" />

// Custom skeleton
<Skeleton className="h-20 w-full rounded-xl" />
```

### Using Specialized Skeletons
```tsx
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/loading-skeletons";

// In your component
if (isLoading) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

### Component with Loading Prop
```tsx
<WeeklyChart jobs={jobs} isLoading={isLoading} />
<ActivityCard activities={activities} isLoading={isLoading} />
```

## Performance Considerations

1. **Minimal Re-renders**: Skeletons are static and don't cause unnecessary re-renders
2. **CSS Animations**: Uses CSS `animate-pulse` instead of JavaScript animations
3. **Lazy Loading**: Skeletons show immediately without waiting for data
4. **Layout Shift Prevention**: Skeletons match exact dimensions of real content

## Accessibility

- Skeletons use semantic HTML
- Proper ARIA labels can be added if needed
- Color contrast meets WCAG standards
- Animation respects `prefers-reduced-motion`

## Future Enhancements

Potential improvements:
1. Add shimmer effect overlay
2. Implement skeleton variants (light/dark)
3. Add custom animation speeds
4. Create skeleton generator utility
5. Add skeleton for mobile-specific layouts

## Testing

To test loading skeletons:
1. Add artificial delay to API calls
2. Throttle network in DevTools
3. Check all pages in different loading states
4. Verify smooth transitions from skeleton to content

## Maintenance

When adding new components:
1. Create matching skeleton component
2. Add to `loading-skeletons.tsx`
3. Update this documentation
4. Test loading states thoroughly
