import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  X,
  Clock,
  Link as LinkIcon,
  Video
} from "lucide-react";

// Generate calendar data
const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const currentMonth = "October 2023";

interface CalendarEvent {
  id: string;
  title: string;
  company: string;
  type: "interview" | "follow-up" | "deadline";
  time?: string;
  link?: string;
}

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday?: boolean;
  events: CalendarEvent[];
}

const calendarData: CalendarDay[] = [
  { date: 24, isCurrentMonth: false, events: [] },
  { date: 25, isCurrentMonth: false, events: [] },
  { date: 26, isCurrentMonth: false, events: [] },
  { date: 27, isCurrentMonth: false, events: [] },
  { date: 28, isCurrentMonth: false, events: [] },
  { date: 29, isCurrentMonth: false, events: [] },
  { date: 30, isCurrentMonth: false, events: [] },
  { date: 1, isCurrentMonth: true, events: [] },
  { date: 2, isCurrentMonth: true, events: [] },
  { date: 3, isCurrentMonth: true, events: [] },
  { date: 4, isCurrentMonth: true, events: [] },
  { date: 5, isCurrentMonth: true, isToday: true, events: [
    { id: "1", title: "Senior UI Designer", company: "Stripe", type: "interview", time: "10:00 - 11:30 AM", link: "meet.google.com/abc-xyz-123" }
  ]},
  { date: 6, isCurrentMonth: true, events: [] },
  { date: 7, isCurrentMonth: true, events: [] },
  { date: 8, isCurrentMonth: true, events: [] },
  { date: 9, isCurrentMonth: true, events: [] },
  { date: 10, isCurrentMonth: true, events: [
    { id: "2", title: "Product Manager", company: "Meta", type: "interview", time: "2:00 PM" },
    { id: "3", title: "Follow up", company: "Airbnb", type: "follow-up" }
  ]},
  { date: 11, isCurrentMonth: true, events: [] },
  { date: 12, isCurrentMonth: true, events: [] },
  { date: 13, isCurrentMonth: true, events: [] },
  { date: 14, isCurrentMonth: true, events: [] },
  { date: 15, isCurrentMonth: true, events: [] },
  { date: 16, isCurrentMonth: true, events: [
    { id: "4", title: "Submit Portfolio", company: "Apple", type: "deadline" }
  ]},
  { date: 17, isCurrentMonth: true, events: [] },
  { date: 18, isCurrentMonth: true, events: [] },
  { date: 19, isCurrentMonth: true, events: [] },
  { date: 20, isCurrentMonth: true, events: [] },
  { date: 21, isCurrentMonth: true, events: [] },
  { date: 22, isCurrentMonth: true, events: [] },
  { date: 23, isCurrentMonth: true, events: [] },
  { date: 24, isCurrentMonth: true, events: [] },
  { date: 25, isCurrentMonth: true, events: [] },
  { date: 26, isCurrentMonth: true, events: [] },
  { date: 27, isCurrentMonth: true, events: [] },
  { date: 28, isCurrentMonth: true, events: [] },
  { date: 29, isCurrentMonth: true, events: [] },
  { date: 30, isCurrentMonth: true, events: [] },
  { date: 31, isCurrentMonth: true, events: [] },
  { date: 1, isCurrentMonth: false, events: [] },
  { date: 2, isCurrentMonth: false, events: [] },
  { date: 3, isCurrentMonth: false, events: [] },
  { date: 4, isCurrentMonth: false, events: [] },
];

const eventColors = {
  interview: "bg-interview text-interview-foreground",
  "follow-up": "bg-pending text-pending-foreground",
  deadline: "bg-accent text-accent-foreground",
};

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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
                Track interviews and important deadlines
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">Today</Button>
              <Button className="gap-2 gradient-primary border-0 shadow-soft">
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="bg-card rounded-xl shadow-card p-6 animate-fade-in">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">{currentMonth}</h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
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
                      className={`w-full text-left text-xs font-medium px-1.5 py-1 rounded truncate ${eventColors[event.type]}`}
                    >
                      {event.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{selectedEvent.title}</h3>
                      <p className="text-sm text-primary">{selectedEvent.company} • Round 2 Interview</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3 mb-6">
                  {selectedEvent.time && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Thursday, Oct 5 • {selectedEvent.time}</span>
                    </div>
                  )}
                  {selectedEvent.link && (
                    <div className="flex items-center gap-3 text-primary">
                      <LinkIcon className="h-4 w-4" />
                      <a href="#" className="text-sm hover:underline">{selectedEvent.link}</a>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1 gradient-primary border-0">Join Call</Button>
                  <Button variant="outline" className="flex-1">Edit</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
