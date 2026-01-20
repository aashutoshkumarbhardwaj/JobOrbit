import { cn } from "@/lib/utils";

export type StatusType = 
  | "applied" 
  | "interviewing" 
  | "offer" 
  | "rejected" 
  | "pending" 
  | "to-apply";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  "applied": {
    label: "Applied",
    className: "bg-applied-light text-applied",
  },
  "interviewing": {
    label: "Interviewing",
    className: "bg-interview-light text-interview",
  },
  "offer": {
    label: "Offer",
    className: "bg-success-light text-success",
  },
  "rejected": {
    label: "Rejected",
    className: "bg-destructive-light text-destructive",
  },
  "pending": {
    label: "Pending",
    className: "bg-pending-light text-pending",
  },
  "to-apply": {
    label: "To Apply",
    className: "bg-muted text-muted-foreground",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
