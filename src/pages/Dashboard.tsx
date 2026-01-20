import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/ui/stat-card";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { StatusType } from "@/components/ui/status-badge";
import { AddJobDialog } from "@/components/AddJobDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  StatCardSkeleton,
  WeeklyChartSkeleton,
  ActivityCardSkeleton
} from "@/components/ui/loading-skeletons";
import { 
  FileText, 
  Calendar, 
  Award, 
  XCircle,
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle2,
  BarChart3,
  Users,
  Eye,
  Activity,
  TrendingDown,
  Brain,
  Lightbulb,
  Star,
  ChevronRight,
  Briefcase,
  RefreshCw,
  AlertTriangle,
  Wifi,
  WifiOff
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";

// Helper function for time-based greeting with error handling
function getTimeBasedGreeting() {
  try {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning!";
    if (hour < 17) return "Good afternoon!";
    return "Good evening!";
  } catch (error) {
    console.error('Error getting time:', error);
    return "Hello!";
  }
}

// Network status hook
function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Job interface
interface Job {
  id: string;
  company: string;
  role: string;
  status: string;
  created_at: string;
  applied_date: string | null;
}

  // Enhanced stats calculation with more insights
function calculateInsights(jobs: Job[]) {
  const total = jobs.length;
  const interviewing = jobs.filter(j => j.status === "interviewing").length;
  const offers = jobs.filter(j => j.status === "offer").length;
  const rejected = jobs.filter(j => j.status === "rejected").length;
  
  const responseRate = total > 0 ? ((interviewing + offers + rejected) / total * 100).toFixed(1) : "0";
  const successRate = total > 0 ? (offers / total * 100).toFixed(1) : "0";
  const interviewRate = interviewing > 0 ? ((interviewing / total) * 100).toFixed(1) : "0";
  
  // Calculate trend (last 7 days vs previous 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const recentApps = jobs.filter(j => new Date(j.created_at) >= sevenDaysAgo).length;
  const previousApps = jobs.filter(j => {
    const date = new Date(j.created_at);
    return date >= fourteenDaysAgo && date < sevenDaysAgo;
  }).length;
  
  const trend = recentApps > previousApps ? "up" : recentApps < previousApps ? "down" : "stable";
  const trendPercentage = previousApps > 0 ? Math.abs(((recentApps - previousApps) / previousApps * 100)).toFixed(0) : "0";
  
  // Calculate application velocity
  const avgAppsPerWeek = total > 0 ? (total / Math.max(1, Math.floor((Date.now() - new Date(jobs[0]?.created_at || Date.now()).getTime()) / (7 * 24 * 60 * 60 * 1000)))).toFixed(1) : "0";
  
  // Calculate time to first interview
  const firstInterview = jobs.filter(j => j.status === "interviewing").sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
  const daysToFirstInterview = firstInterview ? Math.floor((Date.now() - new Date(firstInterview.created_at).getTime()) / (24 * 60 * 60 * 1000)) : null;
  
  return { 
    total, 
    interviewing, 
    offers, 
    rejected, 
    responseRate, 
    successRate, 
    interviewRate,
    trend, 
    trendPercentage, 
    recentApps, 
    avgAppsPerWeek,
    daysToFirstInterview 
  };
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const isOnline = useNetworkStatus();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Enhanced error handling for data fetching
  const { data: jobs = [], refetch, isLoading, error: queryError } = useQuery<Job[]>({
    queryKey: ["jobs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) {
          console.error('Supabase error:', error);
          throw new Error('Failed to fetch job data');
        }
        return data || [];
      } catch (err) {
        console.error('Query error:', err);
        setError('Failed to load your job data. Please try again.');
        return [];
      }
    },
    enabled: !!user,
    retry: (failureCount, error) => {
      if (failureCount < 3 && error.message !== 'Failed to fetch job data') {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle query errors
  useEffect(() => {
    if (queryError) {
      setError('Failed to load your job data. Please try again.');
    }
  }, [queryError]);

  const insights = calculateInsights(jobs || []);
  
  // Retry function
  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setError(null);
    try {
      await refetch();
    } catch (err) {
      setError('Failed to retry. Please refresh the page.');
    } finally {
      setIsRetrying(false);
    }
  }, [refetch]);
  
  // Generate personalized recommendations with better insights
  const getRecommendations = () => {
    const recommendations = [];
    
    if (insights.total < 5) {
      recommendations.push({
        icon: <Target className="h-4 w-4" />,
        title: "Increase Application Rate",
        description: `Aim for 5-10 applications per week (current: ${insights.avgAppsPerWeek})`,
        priority: "high"
      });
    }
    
    if (insights.interviewing === 0 && insights.total > 5) {
      recommendations.push({
        icon: <Lightbulb className="h-4 w-4" />,
        title: "Optimize Your Resume",
        description: "Consider tailoring your resume for each application",
        priority: "high"
      });
    }
    
    if (parseFloat(insights.responseRate) < 30 && insights.total > 3) {
      recommendations.push({
        icon: <Brain className="h-4 w-4" />,
        title: "Improve Response Rate",
        description: `Current rate: ${insights.responseRate}% (industry avg: 30-40%)`,
        priority: "medium"
      });
    }
    
    if (insights.daysToFirstInterview === null && insights.total > 10) {
      recommendations.push({
        icon: <Activity className="h-4 w-4" />,
        title: "Focus on Quality",
        description: "Consider applying to roles that closely match your experience",
        priority: "medium"
      });
    }
    
    if (insights.interviewRate > 0 && parseFloat(insights.interviewRate) < 20) {
      recommendations.push({
        icon: <TrendingUp className="h-4 w-4" />,
        title: "Improve Interview Skills",
        description: `Interview rate: ${insights.interviewRate}% (target: 20%+)`,
        priority: "high"
      });
    }
    
    if (insights.trend === "down" && insights.total > 0) {
      recommendations.push({
        icon: <TrendingDown className="h-4 w-4" />,
        title: "Maintain Consistency",
        description: `Applications decreased by ${insights.trendPercentage}% this week`,
        priority: "high"
      });
    }
    
    return recommendations;
  };

  const recentActivities: { id: string; company: string; role: string; status: StatusType; timeAgo: string }[] = 
    jobs.slice(0, 4).map((job) => ({
      id: job.id,
      company: job.company,
      role: job.role,
      status: job.status as StatusType,
      timeAgo: new Date(job.created_at).toLocaleDateString(),
    }));

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-white">
          {/* Network status indicator */}
          {!isOnline && (
            <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">You're offline. Some features may not work.</span>
              </div>
            </div>
          )}
          
          <div className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">
            {/* Header Skeleton */}
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-96 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>

            {/* Main Content Grid Skeleton */}
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <WeeklyChartSkeleton />
              </div>
              <div className="lg:col-span-2">
                <ActivityCardSkeleton />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state
  if (error && !isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Retrying...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Try again</span>
                  </>
                )}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Refresh page
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-white">
        {/* Network status indicator */}
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">You're offline. Some features may not work.</span>
            </div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Responsive Header */}
          <div className="mb-12 lg:mb-16">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900 mb-2 lg:mb-3">
                  {getTimeBasedGreeting()}, {userName}.
                </h1>
                <p className="text-base sm:text-lg text-gray-500 font-light">
                  Here's your job search overview.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button 
                  variant="ghost" 
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors w-full sm:w-auto"
                  size="lg"
                >
                  Analytics
                </Button>
                <AddJobDialog onJobAdded={() => refetch()}>
                  <Button 
                    className="bg-black text-white hover:bg-gray-800 transition-colors font-medium w-full sm:w-auto"
                    size="lg"
                  >
                    Add Job
                  </Button>
                </AddJobDialog>
              </div>
            </div>
          </div>

          {/* Responsive Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 mb-12 lg:mb-16">
            <div className="group">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 mb-2">{insights.total}</div>
                <div className="text-sm font-medium text-gray-600 tracking-wider mb-3">APPLICATIONS</div>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  {insights.trend === "up" ? (
                    <><TrendingUp className="h-3 w-3 text-green-600" /><span className="text-green-600">+{insights.trendPercentage}%</span></>
                  ) : insights.trend === "down" ? (
                    <><TrendingDown className="h-3 w-3 text-red-600" /><span className="text-red-600">-{insights.trendPercentage}%</span></>
                  ) : (
                    <span className="text-gray-400">Stable</span>
                  )}
                  <span className="text-gray-400 hidden sm:inline">vs last week</span>
                </div>
              </div>
            </div>
            
            <div className="group">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 mb-2">{insights.interviewing}</div>
                <div className="text-sm font-medium text-gray-600 tracking-wider mb-3">INTERVIEWS</div>
                <div className="text-xs text-gray-400">
                  {insights.interviewRate}% conversion rate
                </div>
              </div>
            </div>
            
            <div className="group">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 mb-2">{insights.offers}</div>
                <div className="text-sm font-medium text-gray-600 tracking-wider mb-3">OFFERS</div>
                <div className="text-xs text-gray-400">
                  {insights.successRate}% success rate
                </div>
              </div>
            </div>
            
            <div className="group">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 mb-2">{insights.responseRate}%</div>
                <div className="text-sm font-medium text-gray-600 tracking-wider mb-3">RESPONSE RATE</div>
                <div className="text-xs text-gray-400">
                  {parseFloat(insights.responseRate) > 50 ? "Excellent" : parseFloat(insights.responseRate) > 30 ? "Good" : "Needs improvement"}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Content Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-12">
            {/* Enhanced Activity Section */}
            <div className="xl:col-span-2 space-y-8">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2">Activity</h2>
                    <p className="text-sm text-gray-500">Your application trends over time</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors w-full sm:w-auto"
                    size="sm"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-8">
                  <WeeklyChart jobs={jobs} isLoading={isLoading} />
                </div>
              </div>
              
              {/* Enhanced Progress Section */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-8">Progress</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-all">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-light text-gray-900 mb-2">{Math.min(insights.total, 10)}</div>
                    <div className="text-xs text-gray-500 font-medium tracking-wide mb-3">GOAL PROGRESS</div>
                    <div className="mt-3">
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-500"
                          style={{ width: `${Math.min((insights.total / 10) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-all">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-2xl font-light text-gray-900 mb-2">{insights.interviewing}</div>
                    <div className="text-xs text-gray-500 font-medium tracking-wide mb-3">INTERVIEWS</div>
                    <div className="mt-3">
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-600 transition-all duration-500"
                          style={{ width: `${Math.min((insights.interviewing / 5) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-all">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="text-2xl font-light text-gray-900 mb-2">{insights.offers}</div>
                    <div className="text-xs text-gray-500 font-medium tracking-wide mb-3">OFFERS</div>
                    <div className="mt-3">
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-600 transition-all duration-500"
                          style={{ width: `${Math.min((insights.offers / 3) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Recent Activity */}
            <div className="xl:col-span-1 space-y-8">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2">Recent</h2>
                    <p className="text-sm text-gray-500">Latest updates</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors w-full sm:w-auto"
                    size="sm"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-8">
                  <ActivityCard activities={recentActivities} isLoading={isLoading} />
                </div>
              </div>
              
              {/* Enhanced Insights Section */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2">Insights</h2>
                    <p className="text-sm text-gray-500">Personalized tips</p>
                  </div>
                  <Brain className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div className="space-y-4">
                {getRecommendations().map((rec, index) => (
                  <div 
                    key={index} 
                    className={`bg-white rounded-xl p-6 hover:shadow-md transition-all cursor-pointer group ${
                      rec.priority === 'high' ? 'border-l-4 border-l-red-500' : ''
                    }`}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      animation: 'slide-up 0.3s ease-out'
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        rec.priority === 'high' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        <div className={`text-gray-600 ${
                          rec.priority === 'high' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {rec.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-medium text-gray-900 mb-1 ${
                          rec.priority === 'high' ? 'text-red-700' : ''
                        }`}>{rec.title}</h3>
                        <p className={`text-xs text-gray-500 leading-relaxed ${
                          rec.priority === 'high' ? 'text-red-600' : ''
                        }`}>{rec.description}</p>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-all duration-300 group-hover:translate-x-1 text-gray-400 ${
                        rec.priority === 'high' ? 'text-red-400' : ''
                      }`} />
                    </div>
                  </div>
                ))}
                
                {getRecommendations().length === 0 && (
                  <div 
                    className="bg-white rounded-xl p-8 text-center"
                    style={{
                      animationDelay: '0.2s',
                      animation: 'slide-up 0.3s ease-out'
                    }}
                  >
                    <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-thin text-gray-600 mb-2">Great Progress!</h3>
                    <p className="text-sm text-gray-500">You're on track with your job search</p>
                    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>Strong response rate and consistent application activity</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Quick Actions */}
          <div className="mt-12 lg:mt-16 pt-8 lg:pt-16 border-t border-gray-200">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">Quick Actions</h2>
              <p className="text-gray-500 mb-8 lg:mb-16">Manage your job search efficiently</p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  variant="ghost" 
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors py-3 px-6 sm:px-8 w-full sm:w-auto border border-gray-300"
                  size="lg"
                >
                  Import from LinkedIn
                </Button>
                <AddJobDialog onJobAdded={() => refetch()}>
                  <Button 
                    className="bg-black text-white hover:bg-gray-800 transition-colors font-medium py-3 px-6 sm:px-8 w-full sm:w-auto"
                    size="lg"
                  >
                    Add Application
                  </Button>
                </AddJobDialog>
              </div>
              
              {/* Network status indicator for mobile */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Wifi className={`h-4 w-4 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
                <span>{isOnline ? 'Connected' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
