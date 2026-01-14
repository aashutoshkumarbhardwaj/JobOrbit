import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/ui/stat-card";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { Button } from "@/components/ui/button";
import { StatusType } from "@/components/ui/status-badge";
import { AddJobDialog } from "@/components/AddJobDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  Calendar, 
  Award, 
  XCircle,
  Sparkles,
  TrendingUp
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

  const { data: jobs = [], refetch } = useQuery({
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

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Good morning, {userName}! 👋
              </h1>
              <p className="text-muted-foreground">
                You're making great progress. Keep it up!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                AI Suggestions
              </Button>
              <AddJobDialog onJobAdded={() => refetch()}>
                <Button className="gap-2 gradient-highlight border-0 shadow-glow text-highlight-foreground font-semibold">
                  <TrendingUp className="h-4 w-4" />
                  Add New Job
                </Button>
              </AddJobDialog>
            </div>
          </div>
        </div>

        {/* Highlight Banner */}
        <div className="mb-8 bg-highlight/10 border-2 border-highlight/30 rounded-2xl p-5 flex items-center gap-4 animate-fade-in">
          <div className="h-12 w-12 rounded-xl bg-highlight/30 flex items-center justify-center animate-glow">
            <Sparkles className="h-6 w-6 text-highlight-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              <span className="highlight-text">Pro tip:</span> Add at least 5 applications this week to boost your chances!
            </h3>
            <p className="text-sm text-muted-foreground">You've added {stats.total} so far. Keep the momentum going!</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            <WeeklyChart />
          </div>

          {/* Activity - Takes 2 columns */}
          <div className="lg:col-span-2">
            <ActivityCard activities={recentActivities} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-primary via-primary to-indigo-600 rounded-2xl p-6 animate-fade-in relative overflow-hidden">
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-grid opacity-10" />
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-semibold text-primary-foreground mb-1">
                Ready to land your next role?
              </h3>
              <p className="text-primary-foreground/80">
                Track more applications to increase your chances
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0">
                Import from LinkedIn
              </Button>
              <AddJobDialog onJobAdded={() => refetch()}>
                <Button className="bg-highlight text-highlight-foreground hover:bg-highlight/90 shadow-glow">
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
