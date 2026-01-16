import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  StatCardSkeleton,
  WeeklyChartSkeleton,
  ActivityCardSkeleton,
  KanbanColumnSkeleton,
  TableSkeleton,
  CalendarSkeleton,
  LandingStatsSkeleton,
  TestimonialCardSkeleton,
} from "@/components/ui/loading-skeletons";

export default function SkeletonTest() {
  const [showSkeletons, setShowSkeletons] = useState(true);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Loading Skeleton Test Page
            </h1>
            <p className="text-muted-foreground">
              Preview all loading skeleton components
            </p>
          </div>
          <Button
            onClick={() => setShowSkeletons(!showSkeletons)}
            variant={showSkeletons ? "default" : "outline"}
          >
            {showSkeletons ? "Hide Skeletons" : "Show Skeletons"}
          </Button>
        </div>

        {showSkeletons && (
          <>
            {/* Stat Cards */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Stat Cards</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <StatCardSkeleton key={i} />
                ))}
              </div>
            </section>

            {/* Charts and Activity */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Chart & Activity
              </h2>
              <div className="grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  <WeeklyChartSkeleton />
                </div>
                <div className="lg:col-span-2">
                  <ActivityCardSkeleton />
                </div>
              </div>
            </section>

            {/* Kanban Columns */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Kanban Columns
              </h2>
              <div className="flex gap-6 overflow-x-auto pb-4">
                {[1, 2, 3].map((i) => (
                  <KanbanColumnSkeleton key={i} />
                ))}
              </div>
            </section>

            {/* Table */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Table</h2>
              <TableSkeleton rows={5} />
            </section>

            {/* Calendar */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Calendar</h2>
              <CalendarSkeleton />
            </section>

            {/* Landing Stats */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Landing Stats
              </h2>
              <LandingStatsSkeleton />
            </section>

            {/* Testimonials */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Testimonials
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <TestimonialCardSkeleton key={i} />
                ))}
              </div>
            </section>
          </>
        )}

        {!showSkeletons && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">Click "Show Skeletons" to preview loading states</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
