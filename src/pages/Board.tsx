import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { AddJobDialog } from "@/components/AddJobDialog";
import { EditJobDialog } from "@/components/EditJobDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Command,
  X,
  LayoutGrid,
  Table as TableIcon,
  Calendar,
  DollarSign,
  MapPin,
  Eye,
  Pencil,
  Trash2,
  Briefcase,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

/* ----------------------------- TYPES ----------------------------- */

interface Job {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  salary?: string;
  location?: string;
  notes?: string;
  created_at: string;
  applied_date?: string;
}

interface BoardCard {
  id: string;
  company: string;
  role: string;
  salary?: string;
  location?: string;
  daysAgo?: number;
  status: string;
}

type ViewMode = "kanban" | "table";
type JobStatus = "to_apply" | "applied" | "interviewing" | "offer" | "rejected";

/* ------------------------ STATUS CONFIG --------------------------- */

const STATUS_CONFIG: Record<
  JobStatus,
  { title: string; order: number }
> = {
  to_apply: { title: "To Apply", order: 1 },
  applied: { title: "Applied", order: 2 },
  interviewing: { title: "Interviewing", order: 3 },
  offer: { title: "Offer", order: 4 },
  rejected: { title: "Rejected", order: 5 },
};

/* --------------------------- UTILS -------------------------------- */

const getDaysAgo = (date?: string) =>
  date
    ? Math.floor(
        (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
      )
    : undefined;

const getCompanyAvatar = (name: string) =>
  name.slice(0, 2).toUpperCase();

/* ---------------------------- PAGE -------------------------------- */

export default function Board() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showLimit, setShowLimit] = useState(4);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === "Escape") setCommandOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ["jobs", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Job[]> => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(job => ({
        ...job,
        status: job.status as JobStatus
      }));
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Job deleted",
        description: "The job application has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["jobs", user?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredJobs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return jobs.filter(
      j =>
        j.company.toLowerCase().includes(q) ||
        j.role.toLowerCase().includes(q)
    );
  }, [jobs, searchQuery]);

  const columns = useMemo(() => {
    return (Object.keys(STATUS_CONFIG) as JobStatus[]).map(status => ({
      id: status,
      ...STATUS_CONFIG[status],
      cards: filteredJobs
        .filter(j => j.status === status)
        .slice(0, showLimit)
        .map<BoardCard>(j => ({
          id: j.id,
          company: j.company,
          role: j.role,
          salary: j.salary,
          location: j.location,
          daysAgo: getDaysAgo(j.applied_date),
          status: STATUS_CONFIG[status].title,
        })),
    }));
  }, [filteredJobs, showLimit]);

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex items-baseline gap-2 sm:gap-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">Applications</h1>
                <span className="text-base sm:text-lg text-gray-500">
                  {jobs.length} {jobs.length === 1 ? 'application' : 'applications'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode("kanban")}
                    className={cn(
                      "px-3 py-2 text-sm rounded-md transition-all",
                      viewMode === "kanban"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={cn(
                      "px-3 py-2 text-sm rounded-md transition-all",
                      viewMode === "table"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <TableIcon className="h-4 w-4" />
                  </button>
                </div>

                <AddJobDialog onJobAdded={refetch}>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Application</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </AddJobDialog>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Pipeline</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredJobs.length} of {jobs.length} applications
                    {searchQuery && ` matching "${searchQuery}"`}
                  </p>
                </div> */}
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium self-start sm:self-auto"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
            
            {viewMode === "kanban" ? (
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                  {columns.map(col => (
                    <div key={col.id} className="min-h-[300px] sm:min-h-[400px]">
                      <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wide">
                          {col.title}
                        </h3>
                        <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                          {col.cards.length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {col.cards.length === 0 ? (
                          <div className="min-h-[80px] sm:min-h-[100px] flex items-center justify-center">
                            <p className="text-xs sm:text-sm text-gray-400 italic">
                              No applications
                            </p>
                          </div>
                        ) : (
                          col.cards.map(card => {
                            const fullData = jobs.find(job => job.id === card.id);
                            return fullData ? (
                              <JobCard 
                                key={card.id} 
                                card={card} 
                                fullData={fullData} 
                                onEdit={setEditingJob}
                              />
                            ) : null;
                          })
                        )}
                      </div>

                      {/* Show More Button for Column */}
                      {filteredJobs.filter(j => j.status === col.id).length > showLimit && (
                        <div className="mt-3 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => setShowLimit(prev => prev + 4)}
                            className="w-full px-3 py-2 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Show {Math.min(4, filteredJobs.filter(j => j.status === col.id).length - showLimit)} More
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Show All Button */}
                {filteredJobs.some((_, index) => index >= showLimit) && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setShowLimit(100)}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      Show All Applications
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 sm:p-6">
                <TableView cards={columns.flatMap(c => c.cards)} />
              </div>
            )}
          </div>
        </main>

        {/* EDIT DIALOG */}
        {editingJob && (
          <EditJobDialog
            job={editingJob}
            open={!!editingJob}
            onOpenChange={(open) => !open && setEditingJob(null)}
            onJobUpdated={() => {
              refetch();
              setEditingJob(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
}

/* -------------------------- COMPONENTS ---------------------------- */

function JobCard({ card, fullData, onEdit }: { card: BoardCard; fullData: Job; onEdit: (job: Job) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showActions, setShowActions] = useState(false);

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Job deleted",
        description: "The job application has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the application at ${card.company}?`)) {
      deleteJobMutation.mutate(card.id);
    }
  };

  return (
    <div 
      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-lg transition-all duration-200 cursor-pointer group relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-base font-semibold text-gray-900 leading-tight truncate">
              {card.company}
            </h4>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
              <span className="text-xs font-semibold text-blue-600">
                {card.company.slice(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-tight mb-3">
            {card.role}
          </p>

          <div className="space-y-2">
            {card.location && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                <span className="truncate">{card.location}</span>
              </div>
            )}
            {card.salary && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <DollarSign className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                <span className="truncate">{card.salary}</span>
              </div>
            )}
            {card.daysAgo !== undefined && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                <span>{card.daysAgo} days ago</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={cn(
        "absolute top-2 right-2 flex gap-1 transition-all duration-200",
        showActions ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(fullData);
          }}
          className="p-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-blue-300 transition-colors shadow-sm"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5 text-gray-600" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="p-1.5 bg-white border border-gray-200 rounded-md hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
        </button>
      </div>
    </div>
  );
}

function IconButton({
  icon: Icon,
  danger,
}: {
  icon: any;
  danger?: boolean;
}) {
  return (
    <button
      className={cn(
        "p-1.5 rounded-md hover:bg-gray-100 transition-colors",
        danger && "hover:bg-red-50 text-gray-400 hover:text-red-600"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function TableView({ cards }: { cards: BoardCard[] }) {
  if (!cards.length)
    return (
      <div className="text-center py-12 sm:py-16">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center">
          <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No applications yet</h3>
        <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
          Start by adding your first job application to track your progress.
        </p>
      </div>
    );

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-[500px]">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-gray-900">Company</th>
            <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-gray-900">Role</th>
            <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-gray-900">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {cards.map(card => (
            <tr 
              key={card.id} 
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">{card.company}</td>
              <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-600">{card.role}</td>
              <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500">
                {card.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
