# Loading Skeletons - Quick Reference Guide

## 🎯 Quick Start

### Import Skeletons
```tsx
import { 
  StatCardSkeleton,
  WeeklyChartSkeleton,
  ActivityCardSkeleton,
  KanbanBoardSkeleton,
  TableSkeleton,
  CalendarSkeleton,
  LandingStatsSkeleton,
  TestimonialCardSkeleton
} from "@/components/ui/loading-skeletons";

import { Skeleton } from "@/components/ui/skeleton";
```

## 📦 Available Skeletons

| Skeleton Component | Use Case | Props |
|-------------------|----------|-------|
| `Skeleton` | Base component | `className` |
| `StatCardSkeleton` | Dashboard stat cards | None |
| `WeeklyChartSkeleton` | Chart with bars | None |
| `ActivityCardSkeleton` | Activity feed | None |
| `KanbanColumnSkeleton` | Single kanban column | None |
| `KanbanBoardSkeleton` | Full kanban board | None |
| `TableRowSkeleton` | Single table row | None |
| `TableSkeleton` | Full table | `rows?: number` |
| `CalendarSkeleton` | Calendar grid | None |
| `LandingStatsSkeleton` | Landing page stats | None |
| `TestimonialCardSkeleton` | Testimonial card | None |
| `PageLoadingSkeleton` | Full page layout | None |

## 🔧 Common Patterns

### Pattern 1: Page-Level Loading
```tsx
if (authLoading || isLoading) {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        
        {/* Content */}
        <TableSkeleton rows={10} />
      </div>
    </Layout>
  );
}
```

### Pattern 2: Component-Level Loading
```tsx
export function MyComponent({ data, isLoading }: Props) {
  if (isLoading) {
    return <MyComponentSkeleton />;
  }
  
  return <div>{/* Real content */}</div>;
}
```

### Pattern 3: Inline Loading
```tsx
{isLoading ? (
  <Skeleton className="h-4 w-32" />
) : (
  <span>{data.value}</span>
)}
```

## 📋 Page-Specific Examples

### Dashboard
```tsx
if (authLoading || isLoading) {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
        </div>
        
        {/* Chart & Activity */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <WeeklyChartSkeleton />
          </div>
          <div className="lg:col-span-2">
            <ActivityCardSkeleton />
          </div>
        </div>
      </div>
    </Layout>
  );
}
```

### Board/Kanban
```tsx
if (authLoading || isLoading) {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <KanbanBoardSkeleton />
      </div>
    </Layout>
  );
}
```

### Applications/Table
```tsx
if (authLoading || isLoading) {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <TableSkeleton rows={10} />
      </div>
    </Layout>
  );
}
```

### Calendar
```tsx
if (authLoading || isLoading) {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <CalendarSkeleton />
      </div>
    </Layout>
  );
}
```

## 🎨 Custom Skeletons

### Create Custom Skeleton
```tsx
function MyCustomSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
```

### Skeleton with Loop
```tsx
<div className="space-y-4">
  {Array.from({ length: 5 }).map((_, i) => (
    <Skeleton key={i} className="h-20 w-full" />
  ))}
</div>
```

## 🎭 Animation Variants

### Default Pulse
```tsx
<Skeleton className="h-4 w-32" />
```

### Custom Animation
```tsx
<Skeleton className="h-4 w-32 animate-pulse" />
```

### No Animation
```tsx
<div className="bg-muted rounded-md h-4 w-32" />
```

## 📐 Common Sizes

```tsx
// Small
<Skeleton className="h-3 w-16" />

// Medium
<Skeleton className="h-4 w-32" />

// Large
<Skeleton className="h-6 w-48" />

// Extra Large
<Skeleton className="h-10 w-64" />

// Full Width
<Skeleton className="h-4 w-full" />

// Square
<Skeleton className="h-10 w-10" />

// Circle
<Skeleton className="h-10 w-10 rounded-full" />

// Card
<Skeleton className="h-32 w-full rounded-xl" />
```

## 🔄 Loading State Management

### With React Query
```tsx
const { data, isLoading } = useQuery({
  queryKey: ["data"],
  queryFn: fetchData,
});

if (isLoading) {
  return <MySkeleton />;
}
```

### With useState
```tsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData().then(() => setLoading(false));
}, []);

if (loading) {
  return <MySkeleton />;
}
```

### Multiple Loading States
```tsx
const { data: stats, isLoading: statsLoading } = useQuery(...);
const { data: jobs, isLoading: jobsLoading } = useQuery(...);

return (
  <div>
    {statsLoading ? <StatsSkeleton /> : <Stats data={stats} />}
    {jobsLoading ? <JobsSkeleton /> : <Jobs data={jobs} />}
  </div>
);
```

## ⚡ Performance Tips

1. **Use CSS animations** (already implemented)
2. **Avoid nested skeletons** - keep structure flat
3. **Match real content dimensions** - prevents layout shift
4. **Reuse skeleton components** - don't create duplicates
5. **Keep skeletons simple** - complex animations hurt performance

## 🐛 Troubleshooting

### Skeleton not showing?
- Check if `isLoading` is true
- Verify import path
- Check component is rendered

### Layout shift when loading?
- Ensure skeleton matches content dimensions
- Use same padding/margins
- Match border radius

### Animation not working?
- Check Tailwind config includes animations
- Verify `animate-pulse` class is available
- Check for CSS conflicts

## 📚 Resources

- **Implementation Guide**: `LOADING_SKELETONS_IMPLEMENTATION.md`
- **Summary**: `LOADING_SKELETONS_SUMMARY.md`
- **Component File**: `src/components/ui/loading-skeletons.tsx`
- **Test Page**: `src/pages/SkeletonTest.tsx`

## ✅ Checklist for New Features

When adding new features:
- [ ] Identify loading states
- [ ] Create or reuse skeleton component
- [ ] Match skeleton to content layout
- [ ] Test loading → content transition
- [ ] Verify no layout shift
- [ ] Check mobile responsiveness
- [ ] Update documentation

## 🎯 Best Practices

✅ **DO:**
- Match skeleton to content dimensions
- Use consistent theming
- Keep animations subtle
- Test on slow connections
- Reuse existing skeletons

❌ **DON'T:**
- Create overly complex skeletons
- Use JavaScript animations
- Forget mobile layouts
- Skip loading states
- Duplicate skeleton code

---

**Need help?** Check the full implementation guide or test page for examples.
