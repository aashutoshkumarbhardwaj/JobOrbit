import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/ui/stat-card";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { StatusType } from "@/components/ui/status-badge";
import { AddJobDialog } from "@/components/AddJobDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  StatCardSkeleton,
  WeeklyChartSkeleton,
  ActivityCardSkeleton
} from "@/components/ui/loading-skeletons";
import { 
  FileText, 
  Calendar, 
  Award, 
  XCircle,
  Sparkles,
  TrendingUp,
  Target,
  Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const { data: jobs = [], refetch, isLoading } = useQuery({
    queryKey: ["jobs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const stats = {
    total: jobs.length,
    interviewing: jobs.filter((j) => j.status === "interviewing").length,
    offers: jobs.filter((j) => j.status === "offer").length,
    rejected: jobs.filter((j) => j.status === "rejected").length,
  };

  const recentActivities: { id: string; company: string; role: string; status: StatusType; timeAgo: string }[] = 
    jobs.slice(0, 4).map((job) => ({
      id: job.id,
      company: job.company,
      role: job.role,
      status: job.status as StatusType,
      timeAgo: new Date(job.created_at).toLocaleDateString(),
    }));

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Header Skeleton */}
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="h-10 w-64 bg-muted rounded animate-pulse" />
                <div className="h-6 w-96 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-32 bg-muted rounded animate-pulse" />
                <div className="h-10 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Main Content Grid Skeleton */}
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Motivational Banner */}
        {stats.total >= 5 && (
          <Banner
            variant="gradient"
            title="🔥 You're on fire!"
            message={`Amazing work! You've tracked ${stats.total} applications. Keep this momentum going!`}
            action={{
              label: "View Analytics",
              onClick: () => navigate("/applications"),
            }}
          />
        )}

        {stats.total < 5 && stats.total > 0 && (
          <Banner
            variant="highlight"
            title="💪 Great start!"
            message="You're off to a good start. Add more applications to increase your chances of landing interviews!"
            icon={<Target className="h-5 w-5" />}
          />
        )}

        {/* Welcome Header */}
        <div className="animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight font-display">
                Good morning, {userName}! 👋
              </h1>
              <p className="text-muted-foreground text-lg">
                You're making great progress. Keep it up!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 hover:border-primary hover:text-primary transition-all">
                <Sparkles className="h-4 w-4" />
                AI Suggestions
              </Button>
              <AddJobDialog onJobAdded={() => refetch()}>
                <Button className="gap-2 gradient-highlight border-0 shadow-glow text-highlight-foreground font-semibold hover:scale-105 transition-transform">
                  <TrendingUp className="h-4 w-4" />
                  Add New Job
                </Button>
              </AddJobDialog>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Applications"
            value={stats.total}
            icon={FileText}
            variant="primary"
            trend={stats.total > 0 ? { value: String(stats.total), positive: true } : undefined}
          />
          <StatCard 
            title="Interviews Scheduled"
            value={stats.interviewing}
            icon={Calendar}
            variant="success"
          />
          <StatCard 
            title="Offers Received"
            value={stats.offers}
            icon={Award}
            variant="warning"
          />
          <StatCard 
            title="Rejections"
            value={stats.rejected}
            icon={XCircle}
            variant="destructive"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Chart - Takes 3 columns */}
          <div className="lg:col-span-3">
            <WeeklyChart jobs={jobs} isLoading={isLoading} />
          </div>

          {/* Activity - Takes 2 columns */}
          <div className="lg:col-span-2">
            <ActivityCard activities={recentActivities} isLoading={isLoading} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-2xl p-6 animate-gradient relative overflow-hidden shadow-hover">
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-grid opacity-10" />
          
          {/* Floating elements */}
          <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full blur-xl animate-float" />
          <div className="absolute bottom-4 left-4 w-20 h-20 bg-white/10 rounded-full blur-xl animate-float" style={{ animationDelay: "1s" }} />
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-2 backdrop-blur-sm">
                <Zap className="h-3 w-3" />
                Quick Action
              </div>
              <h3 className="text-2xl font-bold text-white mb-1 font-display">
                Ready to land your next role?
              </h3>
              <p className="text-white/90">
                Track more applications to increase your chances
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-sm">
                Import from LinkedIn
              </Button>
              <AddJobDialog onJobAdded={() => refetch()}>
                <Button className="bg-white text-primary hover:bg-white/90 shadow-lg font-semibold">
                  Add Application
                </Button>
              </AddJobDialog>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
