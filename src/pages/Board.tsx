import { Layout } from "@/components/layout/Layout";
import { StatusType } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Calendar, DollarSign, MapPin } from "lucide-react";

interface BoardCard {
  id: string;
  company: string;
  role: string;
  salary?: string;
  location?: string;
  daysAgo?: number;
}

interface BoardColumn {
  id: StatusType;
  title: string;
  color: string;
  cards: BoardCard[];
}

const columns: BoardColumn[] = [
  {
    id: "to-apply",
    title: "To Apply",
    color: "bg-muted",
    cards: [
      { id: "1", company: "Netflix", role: "Senior Designer", salary: "$170k - $210k", location: "Remote" },
      { id: "2", company: "Uber", role: "Product Designer", salary: "$140k - $180k", location: "San Francisco" },
    ],
  },
  {
    id: "applied",
    title: "Applied",
    color: "bg-applied-light",
    cards: [
      { id: "3", company: "Airbnb", role: "Product Manager", salary: "$130k - $170k", daysAgo: 5 },
      { id: "4", company: "Spotify", role: "UI Designer", salary: "$120k - $160k", daysAgo: 2 },
    ],
  },
  {
    id: "interviewing",
    title: "Interviewing",
    color: "bg-interview-light",
    cards: [
      { id: "5", company: "Google", role: "Senior Product Designer", salary: "$180k - $220k", daysAgo: 8 },
      { id: "6", company: "Apple", role: "Senior UX Designer", salary: "$160k - $200k", daysAgo: 6 },
    ],
  },
  {
    id: "offer",
    title: "Offer",
    color: "bg-success-light",
    cards: [
      { id: "7", company: "Microsoft", role: "Product Designer", salary: "$145k - $185k", daysAgo: 12 },
    ],
  },
  {
    id: "rejected",
    title: "Rejected",
    color: "bg-destructive-light",
    cards: [
      { id: "8", company: "Meta", role: "Design Lead", salary: "$180k - $220k", daysAgo: 15 },
    ],
  },
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
  Uber: "bg-gradient-to-br from-gray-800 to-gray-900",
};

export default function Board() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Board View
              </h1>
              <p className="text-muted-foreground">
                Drag and drop to update application status
              </p>
            </div>
            <Button className="gap-2 gradient-primary border-0 shadow-soft">
              <Plus className="h-4 w-4" />
              Add New Job
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div 
              key={column.id} 
              className="flex-shrink-0 w-72 animate-fade-in"
            >
              {/* Column Header */}
              <div className={`rounded-xl p-4 mb-4 ${column.color}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">
                    {column.title}
                  </h3>
                  <span className="text-sm font-medium text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
                    {column.cards.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {column.cards.map((card) => (
                  <div 
                    key={card.id}
                    className="bg-card rounded-xl p-4 shadow-card hover:shadow-hover transition-all cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white text-xs font-bold ${companyColors[card.company] || "bg-gray-500"}`}>
                        {card.company.slice(0, 2).toUpperCase()}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>

                    <h4 className="font-semibold text-foreground mb-1">{card.role}</h4>
                    <p className="text-sm text-primary font-medium mb-3">{card.company}</p>

                    <div className="space-y-1.5">
                      {card.salary && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <DollarSign className="h-3.5 w-3.5" />
                          {card.salary}
                        </div>
                      )}
                      {card.location && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {card.location}
                        </div>
                      )}
                      {card.daysAgo !== undefined && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          Applied {card.daysAgo} days ago
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add Card Button */}
                <button className="w-full p-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm font-medium hover:border-primary hover:text-primary transition-colors">
                  <Plus className="h-4 w-4 inline-block mr-1" />
                  Add a card
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
