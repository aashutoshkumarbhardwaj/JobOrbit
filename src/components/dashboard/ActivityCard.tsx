import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Activity {
  id: string;
  company: string;
  role: string;
  status: StatusType;
  timeAgo: string;
  logo?: string;
}

interface ActivityCardProps {
  activities: Activity[];
  isLoading?: boolean;
}

const companyColors: Record<string, string> = {
  Google: "bg-gradient-to-br from-gray-700 to-gray-900",
  Stripe: "bg-gradient-to-br from-indigo-500 to-purple-600",
  Airbnb: "bg-gradient-to-br from-rose-400 to-red-500",
  Meta: "bg-gradient-to-br from-blue-500 to-blue-700",
  Apple: "bg-gradient-to-br from-gray-800 to-black",
  Microsoft: "bg-gradient-to-br from-blue-400 to-cyan-500",
};

export function ActivityCard({ activities, isLoading = false }: ActivityCardProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl shadow-card p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <button className="text-sm font-medium text-primary hover:underline">
          View all
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div 
            key={activity.id}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer"
          >
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-white text-xs font-bold ${companyColors[activity.company] || "bg-gradient-to-br from-gray-400 to-gray-600"}`}>
              {activity.company.slice(0, 2).toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{activity.company}</p>
              <p className="text-sm text-muted-foreground truncate">
                {activity.role} • {activity.timeAgo}
              </p>
            </div>
            
            <StatusBadge status={activity.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
