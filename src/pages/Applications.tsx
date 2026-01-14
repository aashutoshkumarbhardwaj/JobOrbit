import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Building2,
  MapPin,
  DollarSign
} from "lucide-react";

interface Application {
  id: string;
  company: string;
  role: string;
  status: StatusType;
  appliedDate: string;
  location: string;
  salary: string;
  interviewDate?: string;
}

const mockApplications: Application[] = [
  { id: "1", company: "Google", role: "Senior Product Designer", status: "interviewing", appliedDate: "Oct 24, 2023", location: "Mountain View, CA", salary: "$140k - $180k", interviewDate: "Nov 2, 2023" },
  { id: "2", company: "Stripe", role: "UX Engineer", status: "pending", appliedDate: "Oct 22, 2023", location: "San Francisco, CA", salary: "$150k - $200k" },
  { id: "3", company: "Airbnb", role: "Product Manager", status: "applied", appliedDate: "Oct 20, 2023", location: "Remote", salary: "$130k - $170k" },
  { id: "4", company: "Meta", role: "Design Lead", status: "rejected", appliedDate: "Oct 15, 2023", location: "Menlo Park, CA", salary: "$180k - $220k" },
  { id: "5", company: "Apple", role: "Senior UX Designer", status: "interviewing", appliedDate: "Oct 18, 2023", location: "Cupertino, CA", salary: "$160k - $200k", interviewDate: "Oct 30, 2023" },
  { id: "6", company: "Microsoft", role: "Product Designer", status: "offer", appliedDate: "Oct 10, 2023", location: "Seattle, WA", salary: "$145k - $185k" },
  { id: "7", company: "Spotify", role: "UI Designer", status: "applied", appliedDate: "Oct 25, 2023", location: "New York, NY", salary: "$120k - $160k" },
  { id: "8", company: "Netflix", role: "Senior Designer", status: "to-apply", appliedDate: "-", location: "Los Angeles, CA", salary: "$170k - $210k" },
];

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

  const filteredApplications = mockApplications.filter(app => 
    app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Button className="gap-2 gradient-primary border-0 shadow-soft">
              <Plus className="h-4 w-4" />
              Add New Job
            </Button>
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
            <FilterPill label="All" count={42} active />
            <FilterPill label="Applied" count={15} />
            <FilterPill label="Interviewing" count={8} />
            <FilterPill label="Offers" count={2} />
            <FilterPill label="Rejected" count={12} />
            <FilterPill label="To Apply" count={5} />
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
              {filteredApplications.map((app) => (
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
                    <StatusBadge status={app.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{app.appliedDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {app.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <DollarSign className="h-3.5 w-3.5" />
                      {app.salary}
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
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 text-sm text-muted-foreground">
          <p>Showing 1-8 of 42 applications</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function FilterPill({ label, count, active }: { label: string; count: number; active?: boolean }) {
  return (
    <button
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
