import { X, Sparkles, TrendingUp, Zap, Star, Rocket } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type BannerVariant = "success" | "warning" | "info" | "highlight" | "gradient";

interface BannerProps {
  variant?: BannerVariant;
  title?: string;
  message: string;
  icon?: React.ReactNode;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const variantStyles = {
  success: "bg-success-light border-success/30 text-success-foreground",
  warning: "bg-warning-light border-warning/30 text-warning-foreground",
  info: "bg-primary/10 border-primary/30 text-primary",
  highlight: "bg-gradient-to-r from-highlight/20 to-highlight/10 border-highlight/30 text-highlight-foreground",
  gradient: "bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-white border-0",
};

const defaultIcons = {
  success: <Star className="h-5 w-5" />,
  warning: <Zap className="h-5 w-5" />,
  info: <Sparkles className="h-5 w-5" />,
  highlight: <TrendingUp className="h-5 w-5" />,
  gradient: <Rocket className="h-5 w-5" />,
};

export function Banner({
  variant = "info",
  title,
  message,
  icon,
  dismissible = true,
  action,
  className,
}: BannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const displayIcon = icon || defaultIcons[variant];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-4 shadow-soft animate-slide-up",
        variantStyles[variant],
        className
      )}
    >
      {variant === "gradient" && (
        <div className="absolute inset-0 animate-shimmer" />
      )}
      
      <div className="relative flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {displayIcon}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold mb-1 text-sm">
              {title}
            </h4>
          )}
          <p className={cn(
            "text-sm leading-relaxed",
            variant === "gradient" ? "text-white/90" : ""
          )}>
            {message}
          </p>
          
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                "mt-2 text-sm font-medium underline underline-offset-2 hover:no-underline transition-all",
                variant === "gradient" ? "text-white" : ""
              )}
            >
              {action.label}
            </button>
          )}
        </div>
        
        {dismissible && (
          <button
            onClick={() => setIsVisible(false)}
            className={cn(
              "flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors",
              variant === "gradient" ? "text-white/80 hover:text-white" : "text-current/60 hover:text-current"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Animated Banner with more emphasis
export function AnimatedBanner({
  variant = "gradient",
  title,
  message,
  icon,
  dismissible = true,
  action,
  className,
}: BannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 shadow-hover animate-bounce-in",
        "bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-gradient",
        className
      )}
    >
      <div className="absolute inset-0 bg-grid opacity-10" />
      
      <div className="relative flex items-start gap-4">
        <div className="flex-shrink-0 p-3 bg-white/20 rounded-xl backdrop-blur-sm">
          {icon || <Rocket className="h-6 w-6 text-white" />}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-bold text-white mb-2 text-lg">
              {title}
            </h3>
          )}
          <p className="text-white/90 leading-relaxed">
            {message}
          </p>
          
          {action && (
            <button
              onClick={action.onClick}
              className="mt-4 px-4 py-2 bg-white text-primary rounded-lg font-semibold text-sm hover:bg-white/90 transition-all shadow-lg"
            >
              {action.label}
            </button>
          )}
        </div>
        
        {dismissible && (
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
