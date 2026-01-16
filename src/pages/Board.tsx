import { Layout } from "@/components/layout/Layout";
import { StatusType } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Banner, AnimatedBanner } from "@/components/ui/banner";
import { AddJobDialog } from "@/components/AddJobDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { KanbanBoardSkeleton, TableSkeleton } from "@/components/ui/loading-skeletons";
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  DollarSign, 
  MapPin,
  Table as TableIcon,
  LayoutGrid,
  Filter,
  Search,
  SortAsc,
  Star,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface BoardCard {
  id: string;
  company: string;
  role: string;
  salary?: string;
  location?: string;
  daysAgo?: number;
  notes?: string;
  created_at: string;
}

interface BoardColumn {
  id: string;
  title: string;
  color: string;
  cards: BoardCard[];
}

const companyColors: Record<string, string> = {
  Google: "bg-gradient-to-br from-blue-500 to-blue-700",
  Stripe: "bg-gradient-to-br from-indigo-500 to-purple-600",
  Airbnb: "bg-gradient-to-br from-rose-400 to-red-500",
  Meta: "bg-gradient-to-br from-blue-500 to-blue-700",
  Apple: "bg-gradient-to-br from-gray-800 to-black",
  Microsoft: "bg-gradient-to-br from-blue-400 to-cyan-500",
  Spotify: "bg-gradient-to-br from-green-400 to-green-600",
  Netflix: "bg-gradient-to-br from-red-500 to-red-700",
  Uber: "bg-gradient-to-br from-gray-800 to-gray-900",
};

type ViewMode = "kanban" | "table";

export default function Board() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Fetch jobs from Supabase
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

  // Group jobs by status
  const columns: BoardColumn[] = [
    {
      id: "to_apply",
      title: "To Apply",
      color: "bg-muted",
      cards: jobs.filter(j => j.status === "to_apply").map(j => ({
        id: j.id,
        company: j.company,
        role: j.role,
        salary: j.salary || undefined,
        location: j.location || undefined,
        notes: j.notes || undefined,
        created_at: j.created_at,
      })),
    },
    {
      id: "applied",
      title: "Applied",
      color: "bg-applied-light",
      cards: jobs.filter(j => j.status === "applied").map(j => ({
        id: j.id,
        company: j.company,
        role: j.role,
        salary: j.salary || undefined,
        location: j.location || undefined,
        daysAgo: j.applied_date ? Math.floor((Date.now() - new Date(j.applied_date).getTime()) / (1000 * 60 * 60 * 24)) : undefined,
        notes: j.notes || undefined,
        created_at: j.created_at,
      })),
    },
    {
      id: "interviewing",
      title: "Interviewing",
      color: "bg-interview-light",
      cards: jobs.filter(j => j.status === "interviewing").map(j => ({
        id: j.id,
        company: j.company,
        role: j.role,
        salary: j.salary || undefined,
        location: j.location || undefined,
        daysAgo: j.applied_date ? Math.floor((Date.now() - new Date(j.applied_date).getTime()) / (1000 * 60 * 60 * 24)) : undefined,
        notes: j.notes || undefined,
        created_at: j.created_at,
      })),
    },
    {
      id: "offer",
      title: "Offer",
      color: "bg-success-light",
      cards: jobs.filter(j => j.status === "offer").map(j => ({
        id: j.id,
        company: j.company,
        role: j.role,
        salary: j.salary || undefined,
        location: j.location || undefined,
        daysAgo: j.applied_date ? Math.floor((Date.now() - new Date(j.applied_date).getTime()) / (1000 * 60 * 60 * 24)) : undefined,
        notes: j.notes || undefined,
        created_at: j.created_at,
      })),
    },
    {
      id: "rejected",
      title: "Rejected",
      color: "bg-destructive-light",
      cards: jobs.filter(j => j.status === "rejected").map(j => ({
        id: j.id,
        company: j.company,
        role: j.role,
        salary: j.salary || undefined,
        location: j.location || undefined,
        daysAgo: j.applied_date ? Math.floor((Date.now() - new Date(j.applied_date).getTime()) / (1000 * 60 * 60 * 24)) : undefined,
        notes: j.notes || undefined,
        created_at: j.created_at,
      })),
    },
  ];

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Header Skeleton */}
          <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <div className="h-10 w-64 bg-muted rounded animate-pulse" />
                <div className="h-6 w-96 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-40 bg-muted rounded-lg animate-pulse" />
                <div className="h-10 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>

            {/* Toolbar Skeleton */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="h-10 flex-1 min-w-[200px] max-w-md bg-muted rounded-lg animate-pulse" />
              <div className="h-10 w-24 bg-muted rounded animate-pulse" />
              <div className="h-10 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>

          {/* Content Skeleton */}
          {viewMode === "kanban" ? (
            <KanbanBoardSkeleton />
          ) : (
            <TableSkeleton rows={8} />
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Dynamic Banner */}
        {jobs.length >= 5 && (
          <AnimatedBanner
            title="🎉 You're on fire!"
            message={`You've tracked ${jobs.length} applications. Keep up the momentum and land that dream role!`}
            action={{
              label: "View Analytics",
              onClick: () => navigate("/applications"),
            }}
            dismissible={true}
          />
        )}

        {jobs.length === 0 && (
          <Banner
            variant="info"
            title="👋 Welcome to your board!"
            message="Start by adding your first job application to track your progress."
          />
        )}

        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">
                Application Board
              </h1>
              <p className="text-muted-foreground text-lg">
                Organize and track your job applications with ease
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setViewMode("kanban")}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-all",
                    viewMode === "kanban"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="h-4 w-4 inline-block mr-1.5" />
                  Board
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-all",
                    viewMode === "table"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <TableIcon className="h-4 w-4 inline-block mr-1.5" />
                  Table
                </button>
              </div>

              <AddJobDialog onJobAdded={() => refetch()}>
                <Button className="gap-2 gradient-primary border-0 shadow-soft hover:shadow-hover transition-all">
                  <Plus className="h-4 w-4" />
                  Add Job
                </Button>
              </AddJobDialog>
            </div>
          </div>

          {/* Toolbar */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search applications..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            
            <Button variant="outline" size="sm" className="gap-2">
              <SortAsc className="h-4 w-4" />
              Sort
            </Button>
          </div>
        </div>

        {/* Content */}
        {viewMode === "kanban" ? (
          <KanbanView columns={columns} />
        ) : (
          <TableView columns={columns} />
        )}
      </div>
    </Layout>
  );
}

function KanbanView({ columns }: { columns: BoardColumn[] }) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4 animate-fade-in">
      {columns.map((column, index) => (
        <div 
          key={column.id} 
          className="flex-shrink-0 w-80 animate-slide-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Column Header */}
          <div className={cn(
            "rounded-xl p-4 mb-4 backdrop-blur-sm border border-border/50",
            column.color
          )}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-lg">
                {column.title}
              </h3>
              <span className="text-sm font-semibold text-muted-foreground bg-background/60 px-3 py-1 rounded-full">
                {column.cards.length}
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {column.cards.map((card) => (
              <JobCard key={card.id} card={card} />
            ))}

            {/* Add Card Button */}
            <button className="w-full p-4 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all group">
              <Plus className="h-4 w-4 inline-block mr-1.5 group-hover:scale-110 transition-transform" />
              Add application
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function JobCard({ card }: { card: BoardCard }) {
  return (
    <div className="group bg-card rounded-xl p-5 shadow-card hover:shadow-hover transition-all cursor-grab active:cursor-grabbing hover:scale-[1.02] border border-border/50">
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg",
          companyColors[card.company] || "bg-gradient-to-br from-gray-500 to-gray-700"
        )}>
          {card.company.slice(0, 2).toUpperCase()}
        </div>
        
        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <h4 className="font-bold text-foreground mb-1 text-lg">{card.role}</h4>
      <p className="text-sm text-primary font-semibold mb-4">{card.company}</p>

      <div className="space-y-2">
        {card.salary && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">{card.salary}</span>
          </div>
        )}
        {card.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{card.location}</span>
          </div>
        )}
        {card.daysAgo !== undefined && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>Applied {card.daysAgo} days ago</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TableView({ columns }: { columns: BoardColumn[] }) {
  const allCards = columns.flatMap(col => 
    col.cards.map(card => ({ ...card, status: col.title }))
  );

  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left p-4 font-bold text-sm text-foreground">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Company
                </div>
              </th>
              <th className="text-left p-4 font-bold text-sm text-foreground">Role</th>
              <th className="text-left p-4 font-bold text-sm text-foreground">Status</th>
              <th className="text-left p-4 font-bold text-sm text-foreground">Salary</th>
              <th className="text-left p-4 font-bold text-sm text-foreground">Location</th>
              <th className="text-left p-4 font-bold text-sm text-foreground">Applied</th>
              <th className="text-right p-4 font-bold text-sm text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allCards.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No applications yet. Add your first job to get started!
                </td>
              </tr>
            ) : (
              allCards.map((card, index) => (
                <tr 
                  key={card.id} 
                  className="border-b border-border hover:bg-muted/30 transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md flex-shrink-0",
                        companyColors[card.company] || "bg-gradient-to-br from-gray-500 to-gray-700"
                      )}>
                        {card.company.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-foreground">{card.company}</span>
                    </div>
                  </td>
                  <td className="p-4 font-medium text-foreground">{card.role}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      {card.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground font-medium">{card.salary || "—"}</td>
                  <td className="p-4 text-sm text-muted-foreground">{card.location || "—"}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {card.daysAgo ? `${card.daysAgo}d ago` : "—"}
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
