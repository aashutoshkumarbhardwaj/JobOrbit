import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { day: "Mon", applications: 3 },
  { day: "Tue", applications: 5 },
  { day: "Wed", applications: 4 },
  { day: "Thu", applications: 7 },
  { day: "Fri", applications: 2 },
  { day: "Sat", applications: 4 },
  { day: "Sun", applications: 6 },
];

export function WeeklyChart() {
  return (
    <div className="bg-card rounded-xl shadow-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-foreground">Weekly Progress</h3>
        <div className="flex items-center gap-1">
          <span className="text-success font-semibold text-sm">+15%</span>
          <span className="text-muted-foreground text-sm">vs last week</span>
        </div>
      </div>
      
      <div className="h-48 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
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
      </div>
    </div>
  );
}
