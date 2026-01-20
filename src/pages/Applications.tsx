import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddJobDialog } from "@/components/AddJobDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { TableSkeleton } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  ArrowUpDown,
  Download,
  Eye,
  Pencil,
  Trash2,
  MapPin,
  DollarSign
} from "lucide-react";
import { LinkedInImportDialog } from "@/components/LinkedInImportDialog";

interface Application {
  id: string;
  company: string;
  role: string;
  status: string;
  applied_date: string | null;
  location: string | null;
  salary: string | null;
  interview_date: string | null;
  created_at: string;
}

const companyColors: Record<string, string> = {
  Google: "bg-gradient-to-br from-gray-700 to-gray-900",
  Stripe: "bg-gradient-to-br from-indigo-500 to-purple-600",
  Airbnb: "bg-gradient-to-br from-rose-400 to-red-500",
  Meta: "bg-gradient-to-br from-blue-500 to-blue-700",
  Apple: "bg-gradient-to-br from-gray-800 to-black",
  Microsoft: "bg-gradient-to-br from-blue-400 to-cyan-500",
  Spotify: "bg-gradient-to-br from-green-400 to-green-600",
  Netflix: "bg-gradient-to-br from-red-500 to-red-700",
};

export default function Applications() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
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
      return data as Application[];
    },
    enabled: !!user,
  });

  // Calculate status counts
  const statusCounts = {
    all: jobs.length,
    applied: jobs.filter(j => j.status === "applied").length,
    interviewing: jobs.filter(j => j.status === "interviewing").length,
    offer: jobs.filter(j => j.status === "offer").length,
    rejected: jobs.filter(j => j.status === "rejected").length,
    to_apply: jobs.filter(j => j.status === "to_apply").length,
  };

  // Filter jobs
  const filteredApplications = jobs.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Delete job
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    
    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id);
    
    if (!error) {
      refetch();
    }
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-5 w-80" />
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
          </div>

          {/* Filters Bar Skeleton */}
          <div className="bg-card rounded-xl shadow-card p-4 mb-6 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
            {/* Status Pills Skeleton */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-full" />
              ))}
            </div>
          </div>

          {/* Table Skeleton */}
          <TableSkeleton rows={10} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Applications
              </h1>
              <p className="text-muted-foreground">
                Track and manage all your job applications
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="gap-2">
                <Download className="h-4 w-4" />
                Import from LinkedIn
              </Button>
              <AddJobDialog onJobAdded={() => refetch()}>
                <Button className="gap-2 gradient-primary border-0 shadow-soft">
                  <Plus className="h-4 w-4" />
                  Add New Job
                </Button>
              </AddJobDialog>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-card rounded-xl shadow-card p-4 mb-6 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search companies or roles..." 
                className="pl-9 bg-muted border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Button variant="outline" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <FilterPill 
              label="All" 
              count={statusCounts.all} 
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            />
            <FilterPill 
              label="Applied" 
              count={statusCounts.applied}
              active={statusFilter === "applied"}
              onClick={() => setStatusFilter("applied")}
            />
            <FilterPill 
              label="Interviewing" 
              count={statusCounts.interviewing}
              active={statusFilter === "interviewing"}
              onClick={() => setStatusFilter("interviewing")}
            />
            <FilterPill 
              label="Offers" 
              count={statusCounts.offer}
              active={statusFilter === "offer"}
              onClick={() => setStatusFilter("offer")}
            />
            <FilterPill 
              label="Rejected" 
              count={statusCounts.rejected}
              active={statusFilter === "rejected"}
              onClick={() => setStatusFilter("rejected")}
            />
            <FilterPill 
              label="To Apply" 
              count={statusCounts.to_apply}
              active={statusFilter === "to_apply"}
              onClick={() => setStatusFilter("to_apply")}
            />
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-card rounded-xl shadow-card overflow-hidden animate-fade-in">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Company</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Applied</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold">Salary</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <p className="mb-2">
                        {searchQuery || statusFilter !== "all" 
                          ? "No applications match your filters" 
                          : "No applications yet"}
                      </p>
                      {!searchQuery && statusFilter === "all" && (
                        <AddJobDialog onJobAdded={() => refetch()}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add your first application
                          </Button>
                        </AddJobDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow 
                    key={app.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white text-xs font-bold ${companyColors[app.company] || "bg-gray-500"}`}>
                          {app.company.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-foreground">{app.company}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{app.role}</TableCell>
                    <TableCell>
                      <StatusBadge status={app.status as StatusType} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {app.applied_date 
                        ? new Date(app.applied_date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {app.location || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        {app.salary || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="gap-2">
                            <Eye className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 text-destructive focus:text-destructive"
                            onClick={() => handleDelete(app.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredApplications.length > 0 && (
          <div className="flex items-center justify-between mt-6 text-sm text-muted-foreground">
            <p>Showing {filteredApplications.length} of {jobs.length} applications</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        )}
      </div>
      <LinkedInImportDialog open={isImportDialogOpen} onOpenChange={setImportDialogOpen} />
    </Layout>
  );
}

function FilterPill({ 
  label, 
  count, 
  active,
  onClick 
}: { 
  label: string; 
  count: number; 
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
        active 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
      }`}
    >
      {label}
      <span className={`text-xs ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        {count}
      </span>
    </button>
  );
}