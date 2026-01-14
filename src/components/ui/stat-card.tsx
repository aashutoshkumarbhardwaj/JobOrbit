import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "destructive";
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

const variantStyles = {
  primary: {
    bg: "bg-secondary",
    icon: "bg-primary text-primary-foreground",
    text: "text-primary",
  },
  success: {
    bg: "bg-success-light",
    icon: "bg-success text-success-foreground",
    text: "text-success",
  },
  warning: {
    bg: "bg-warning-light",
    icon: "bg-warning text-warning-foreground",
    text: "text-warning",
  },
  destructive: {
    bg: "bg-destructive-light",
    icon: "bg-destructive text-destructive-foreground",
    text: "text-destructive",
  },
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  variant = "primary",
  trend,
  className 
}: StatCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-5 transition-all duration-200 hover:shadow-hover",
        styles.bg,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn("text-3xl font-bold tracking-tight", styles.text)}>
            {value}
          </p>
          {trend && (
            <p className={cn(
              "text-xs font-medium",
              trend.positive ? "text-success" : "text-destructive"
            )}>
              {trend.positive ? "+" : ""}{trend.value} vs last week
            </p>
          )}
        </div>
        <div className={cn(
          "rounded-xl p-2.5",
          styles.icon
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
