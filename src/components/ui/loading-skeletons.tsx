import { Skeleton } from "./skeleton";

// Dashboard Skeletons
export function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-xl shadow-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function WeeklyChartSkeleton() {
  return (
    <div className="bg-card rounded-xl shadow-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="h-48 mt-4 flex items-end justify-between gap-2">
        {[35, 55, 40, 70, 50, 80, 65].map((height, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <Skeleton 
              className="w-full rounded-t" 
              style={{ height: `${height}%` }}
            />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivityCardSkeleton() {
  return (
    <div className="bg-card rounded-xl shadow-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Board/Kanban Skeletons
export function KanbanColumnSkeleton() {
  return (
    <div className="flex-shrink-0 w-80 animate-fade-in">
      <div className="rounded-xl p-4 mb-4 bg-muted">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-8 rounded-full" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl p-5 shadow-card border border-border/50">
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanBoardSkeleton() {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <KanbanColumnSkeleton key={i} />
      ))}
    </div>
  );
}

// Table Skeletons
export function TableRowSkeleton() {
  return (
    <tr className="border-b border-border">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-24" />
        </div>
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="p-4">
        <Skeleton className="h-6 w-20 rounded-full" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-16" />
      </td>
      <td className="p-4">
        <Skeleton className="h-8 w-8 rounded" />
      </td>
    </tr>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="text-left p-4">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="text-left p-4">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="text-left p-4">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="text-left p-4">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="text-left p-4">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="text-left p-4">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="text-right p-4">
              <Skeleton className="h-4 w-16" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Calendar Skeletons
export function CalendarSkeleton() {
  return (
    <div className="bg-card rounded-xl shadow-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="text-center py-2">
            <Skeleton className="h-3 w-8 mx-auto" />
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 42 }).map((_, i) => (
          <div key={i} className="min-h-24 p-2 rounded-lg border border-transparent">
            <Skeleton className="h-7 w-7 rounded-full mb-2" />
            <div className="space-y-1">
              {Math.random() > 0.7 && <Skeleton className="h-5 w-full rounded" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Landing Page Skeletons
export function LandingStatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-12 text-center max-w-5xl mx-auto mb-12">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <Skeleton className="h-12 w-32 mb-2 mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function TestimonialCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border/50 p-6 animate-pulse">
      <Skeleton className="h-4 w-20 mb-4" />
      <Skeleton className="h-16 w-full mb-4" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-32" />
        </div>
      </div>
    </div>
  );
}

// Generic Page Loading
export function PageLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="animate-fade-in">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <WeeklyChartSkeleton />
        </div>
        <div className="lg:col-span-2">
          <ActivityCardSkeleton />
        </div>
      </div>
    </div>
  );
}
