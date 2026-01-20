import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface Job {
  id: string;
  created_at: string;
  applied_date: string | null;
}

interface WeeklyChartProps {
  jobs?: Job[];
  isLoading?: boolean;
}

export function WeeklyChart({ jobs = [], isLoading = false }: WeeklyChartProps) {
  // Calculate weekly data from real jobs
  const { weeklyData, percentageChange } = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const counts = new Array(7).fill(0);
    const lastWeekCounts = new Array(7).fill(0);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get start of current week (Monday)
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so we need 6 days back
    currentWeekStart.setDate(today.getDate() - daysToMonday);
    
    // Get start of last week
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    jobs.forEach(job => {
      // Use applied_date if available, otherwise use created_at
      const dateStr = job.applied_date || job.created_at;
      const jobDate = new Date(dateStr);
      const jobDay = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate());
      
      // Calculate days difference from current week start
      const diffTime = jobDay.getTime() - currentWeekStart.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // If in current week (0-6 days from Monday)
      if (diffDays >= 0 && diffDays < 7) {
        counts[diffDays]++;
      }
      
      // Calculate for last week
      const lastWeekDiff = jobDay.getTime() - lastWeekStart.getTime();
      const lastWeekDays = Math.floor(lastWeekDiff / (1000 * 60 * 60 * 24));
      
      if (lastWeekDays >= 0 && lastWeekDays < 7) {
        lastWeekCounts[lastWeekDays]++;
      }
    });
    
    // Calculate percentage change
    const currentTotal = counts.reduce((a, b) => a + b, 0);
    const lastTotal = lastWeekCounts.reduce((a, b) => a + b, 0);
    
    let change = 0;
    if (lastTotal > 0) {
      change = Math.round(((currentTotal - lastTotal) / lastTotal) * 100);
    } else if (currentTotal > 0) {
      change = 100;
    }
    
    const data = days.map((day, i) => ({
      day,
      applications: counts[i]
    }));
    
    return {
      weeklyData: data,
      percentageChange: change
    };
  }, [jobs]);

  const hasData = weeklyData.some(d => d.applications > 0);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl shadow-card p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="h-48 mt-4 flex items-end justify-between gap-2">
          {[35, 55, 40, 70, 50, 80, 65].map((height, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <Skeleton 
                className="w-full rounded-t" 
                style={{ height: `${height}%` }}
              />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-foreground">Weekly Progress</h3>
        {hasData && (
          <div className="flex items-center gap-1">
            <span className={`font-semibold text-sm ${
              percentageChange >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {percentageChange >= 0 ? '+' : ''}{percentageChange}%
            </span>
            <span className="text-muted-foreground text-sm">vs last week</span>
          </div>
        )}
      </div>
      
      <div className="h-48 mt-4">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(225, 84%, 58%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(225, 84%, 58%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(220, 15%, 50%)', fontSize: 12 }}
                dy={10}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  padding: '8px 12px',
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Area 
                type="monotone" 
                dataKey="applications" 
                stroke="hsl(225, 84%, 58%)" 
                strokeWidth={3}
                fill="url(#colorApps)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm mb-1">No applications this week</p>
              <p className="text-xs">Add jobs to see your progress</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
