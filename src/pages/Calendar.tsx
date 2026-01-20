import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { AddJobDialog } from "@/components/AddJobDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CalendarSkeleton } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  X,
  Clock,
  Link as LinkIcon,
  Video,
  Calendar as CalendarIcon
} from "lucide-react";

const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface CalendarEvent {
  id: string;
  title: string;
  company: string;
  type: "interview" | "applied" | "deadline";
  date: Date;
  time?: string;
  link?: string;
  notes?: string;
}

interface CalendarDay {
  date: number;
  fullDate: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

const eventColors = {
  interview: "bg-interview text-interview-foreground",
  applied: "bg-applied text-applied-foreground",
  deadline: "bg-warning text-warning-foreground",
};

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Fetch jobs with dates from Supabase
  const { data: jobs = [], refetch, isLoading } = useQuery({
    queryKey: ["jobs-calendar", user?.id, currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Generate calendar data with real events
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get starting day (Sunday of the week containing the 1st)
    const startingDayOfWeek = firstDay.getDay();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startingDayOfWeek);
    
    // Generate 42 days (6 weeks)
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dayEvents: CalendarEvent[] = [];
      
      // Add interview events
      jobs.forEach(job => {
        if (job.interview_date) {
          const interviewDate = new Date(job.interview_date);
          if (
            interviewDate.getDate() === date.getDate() &&
            interviewDate.getMonth() === date.getMonth() &&
            interviewDate.getFullYear() === date.getFullYear()
          ) {
            dayEvents.push({
              id: job.id,
              title: job.role,
              company: job.company,
              type: "interview",
              date: interviewDate,
              link: job.url || undefined,
              notes: job.notes || undefined,
            });
          }
        }
        
        // Add applied date events
        if (job.applied_date && job.status === "applied") {
          const appliedDate = new Date(job.applied_date);
          if (
            appliedDate.getDate() === date.getDate() &&
            appliedDate.getMonth() === date.getMonth() &&
            appliedDate.getFullYear() === date.getFullYear()
          ) {
            dayEvents.push({
              id: `${job.id}-applied`,
              title: `Applied: ${job.role}`,
              company: job.company,
              type: "applied",
              date: appliedDate,
            });
          }
        }
      });
      
      days.push({
        date: date.getDate(),
        fullDate: date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        events: dayEvents,
      });
    }
    
    return days;
  }, [currentDate, jobs]);

  const currentMonthName = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-5 w-64" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>

          {/* Calendar Skeleton */}
          <CalendarSkeleton />
        </div>
      </Layout>
    );
  }

  // Count upcoming interviews
  const upcomingInterviews = jobs.filter(job => {
    if (!job.interview_date) return false;
    const interviewDate = new Date(job.interview_date);
    return interviewDate >= new Date();
  }).length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Calendar
              </h1>
              <p className="text-muted-foreground">
                {upcomingInterviews > 0 
                  ? `${upcomingInterviews} upcoming interview${upcomingInterviews > 1 ? 's' : ''}`
                  : "Track interviews and important deadlines"}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={goToToday}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Today
              </Button>
              <AddJobDialog onJobAdded={() => refetch()}>
                <Button className="gap-2 gradient-primary border-0 shadow-soft">
                  <Plus className="h-4 w-4" />
                  Add Job
                </Button>
              </AddJobDialog>
            </div>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="bg-card rounded-xl shadow-card p-6 animate-fade-in">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">{currentMonthName}</h2>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {days.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarData.map((day, idx) => (
              <div
                key={idx}
                className={`min-h-24 p-2 rounded-lg border transition-colors ${
                  day.isCurrentMonth 
                    ? day.isToday 
                      ? "border-primary bg-secondary" 
                      : "border-transparent hover:bg-muted"
                    : "opacity-40"
                }`}
              >
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                  day.isToday 
                    ? "bg-primary text-primary-foreground" 
                    : "text-foreground"
                }`}>
                  {day.date}
                </span>
                
                <div className="mt-1 space-y-1">
                  {day.events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-left text-xs font-medium px-1.5 py-1 rounded truncate ${eventColors[event.type]} hover:opacity-80 transition-opacity`}
                    >
                      {event.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {jobs.length === 0 && (
            <div className="mt-8 text-center text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">No events yet</p>
              <p className="text-sm">Add jobs with interview dates to see them here</p>
            </div>
          )}
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
            <div className="relative bg-card rounded-t-2xl md:rounded-2xl shadow-lg w-full max-w-md mx-4 mb-0 md:mb-4 animate-scale-in">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                      {selectedEvent.type === "interview" ? (
                        <Video className="h-6 w-6 text-primary" />
                      ) : (
                        <CalendarIcon className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{selectedEvent.title}</h3>
                      <p className="text-sm text-primary">{selectedEvent.company}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      {selectedEvent.date.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      {selectedEvent.time && ` • ${selectedEvent.time}`}
                    </span>
                  </div>
                  {selectedEvent.link && (
                    <div className="flex items-center gap-3 text-primary">
                      <LinkIcon className="h-4 w-4" />
                      <a 
                        href={selectedEvent.link.startsWith('http') ? selectedEvent.link : `https://${selectedEvent.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline truncate"
                      >
                        {selectedEvent.link}
                      </a>
                    </div>
                  )}
                  {selectedEvent.notes && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">{selectedEvent.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {selectedEvent.link && selectedEvent.type === "interview" && (
                    <Button 
                      className="flex-1 gradient-primary border-0"
                      onClick={() => window.open(
                        selectedEvent.link!.startsWith('http') ? selectedEvent.link : `https://${selectedEvent.link}`,
                        '_blank'
                      )}
                    >
                      Join Call
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedEvent(null);
                      // Could open edit dialog here
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
