import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  ArrowRight,
  Sparkles,
  BarChart3,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Target,
  DollarSign,
  MapPin,
  Star
} from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLandingStats, useTestimonials } from "@/hooks/useLandingData";
import { LandingStatsSkeleton, TestimonialCardSkeleton } from "@/components/ui/loading-skeletons";

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Fetch dynamic data
  const { data: landingStats, isLoading: statsLoading } = useLandingStats();
  const { data: testimonials, isLoading: testimonialsLoading } = useTestimonials();

  useEffect(() => {
    // Hero animation
    if (heroRef.current) {
      gsap.from(heroRef.current.children, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out"
      });
    }

    // Stats animation on scroll
    if (statsRef.current) {
      gsap.from(statsRef.current.children, {
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 80%",
        },
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.7)"
      });
    }

    // Chart bars animation
    if (chartRef.current) {
      const bars = chartRef.current.querySelectorAll('.chart-bar');
      gsap.from(bars, {
        scrollTrigger: {
          trigger: chartRef.current,
          start: "top 80%",
        },
        scaleY: 0,
        transformOrigin: "bottom",
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out"
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Ultra-minimal Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto flex h-11 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-foreground">
              <Briefcase className="h-3 w-3 text-background" />
            </div>
            <span className="text-sm font-semibold text-foreground">JobTracker</span>
          </Link>
          
          <div className="flex items-center gap-5">
            <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-4 h-7 text-xs font-medium">
                Try free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero - Apple Spacing */}
      <section className="pt-24 pb-20 relative overflow-hidden">
        {/* Subtle background elements */}
        <div className="absolute top-32 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center" ref={heroRef}>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-[-0.03em] mb-6">
              <span className="text-foreground">Your job search.</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Beautifully organized.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10 font-light">
              Track applications, schedule interviews, and land your dream job with the most intuitive tracker ever made.
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-8">
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-white hover:opacity-90 rounded-full px-8 h-12 text-base font-medium shadow-lg">
                  Get started
                </Button>
              </Link>
              <button className="text-primary text-base font-medium hover:underline underline-offset-4">
                Watch demo
              </button>
            </div>
            
            {/* Trust badges */}
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>2 min setup</span>
              </div>
            </div>
          </div>

          {/* Interactive Product Preview with Real Content */}
          <div className="max-w-6xl mx-auto mt-16">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card">
              <div className="aspect-[16/9] bg-gradient-to-br from-muted/30 via-background to-muted/20 p-8">
                <div className="h-full rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm p-6 flex flex-col gap-4">
                  {/* Animated Header with Real Data */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-purple-500" />
                      <span className="text-sm font-semibold text-foreground">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-sm text-primary font-medium">12 Active</span>
                    </div>
                  </div>
                  
                  {/* Real Stats Grid with Icons */}
                  <div className="grid grid-cols-4 gap-3" ref={statsRef}>
                    <StatCard icon={<Briefcase className="h-4 w-4" />} value="24" label="Applied" color="primary" />
                    <StatCard icon={<Calendar className="h-4 w-4" />} value="8" label="Interviews" color="success" />
                    <StatCard icon={<Star className="h-4 w-4" />} value="3" label="Offers" color="warning" />
                    <StatCard icon={<TrendingUp className="h-4 w-4" />} value="85%" label="Response" color="primary" />
                  </div>
                  
                  {/* Animated Chart with Real Data */}
                  <div className="flex-1 bg-card rounded-xl border border-border/50 p-4" ref={chartRef}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">Weekly Activity</span>
                      <span className="text-sm text-primary font-medium">+12% this week</span>
                    </div>
                    <div className="h-full flex items-end justify-between gap-2">
                      {[
                        { height: 35, label: "Mon" },
                        { height: 55, label: "Tue" },
                        { height: 40, label: "Wed" },
                        { height: 70, label: "Thu" },
                        { height: 50, label: "Fri" },
                        { height: 80, label: "Sat" },
                        { height: 65, label: "Sun" }
                      ].map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                          <div 
                            className="chart-bar w-full bg-gradient-to-t from-primary to-purple-500 rounded-t transition-all hover:opacity-80 cursor-pointer" 
                            style={{ height: `${day.height}%` }}
                          />
                          <span className="text-xs text-muted-foreground">{day.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Apple Spacing */}
      <section className="py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-[-0.02em]">
              Everything you need
            </h2>
            <p className="text-lg text-muted-foreground">Powerful features that make job tracking effortless</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureBlock
              icon={<BarChart3 className="h-6 w-6" />}
              title="Insights that matter"
              description="Beautiful analytics show you what's working. Make smarter decisions faster."
              color="primary"
            />
            <FeatureBlock
              icon={<Calendar className="h-6 w-6" />}
              title="Never miss a beat"
              description="All your interviews and deadlines in one elegant calendar view."
              color="success"
            />
            <FeatureBlock
              icon={<Sparkles className="h-6 w-6" />}
              title="Effortlessly simple"
              description="Every detail refined. Every interaction considered. Just works."
              color="highlight"
            />
          </div>
        </div>
      </section>

      {/* Split Feature 1 - Apple Spacing */}
      <section className="py-28 border-t border-border/40 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-border/50 p-8">
                <div className="grid grid-cols-3 gap-3">
                  {/* Kanban Columns */}
                  <KanbanColumn title="To Apply" count={5} color="muted" />
                  <KanbanColumn title="Applied" count={8} color="primary" />
                  <KanbanColumn title="Interview" count={3} color="success" />
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-[-0.02em] mb-6">
                Organize like
                <br />
                a pro.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Drag and drop between stages. Kanban boards that make sense. See your pipeline at a glance.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-base text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  <span>Visual pipeline management</span>
                </li>
                <li className="flex items-center gap-3 text-base text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  <span>Drag & drop interface</span>
                </li>
                <li className="flex items-center gap-3 text-base text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  <span>Custom stages and workflows</span>
                </li>
              </ul>
              <button className="text-primary text-base font-medium hover:underline underline-offset-4 inline-flex items-center gap-2">
                Learn more
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Split Feature 2 - Apple Spacing */}
      <section className="py-28 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-[-0.02em] mb-6">
                Track every
                <br />
                detail.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Company info, salary ranges, locations, notes. Everything you need in one place.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-base text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  <span>Rich job details and notes</span>
                </li>
                <li className="flex items-center gap-3 text-base text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  <span>Salary tracking and comparison</span>
                </li>
                <li className="flex items-center gap-3 text-base text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  <span>Contact management</span>
                </li>
              </ul>
              <button className="text-primary text-base font-medium hover:underline underline-offset-4 inline-flex items-center gap-2">
                Learn more
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div>
              <div className="rounded-2xl bg-gradient-to-br from-success/5 to-transparent border border-border/50 p-8">
                <div className="flex flex-col gap-3">
                  <JobCard company="Google" role="Senior Designer" salary="$180k" location="Remote" />
                  <JobCard company="Apple" role="Product Designer" salary="$160k" location="Cupertino" />
                  <JobCard company="Netflix" role="UX Designer" salary="$170k" location="Los Gatos" />
                  <JobCard company="Meta" role="Design Lead" salary="$190k" location="Menlo Park" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats - Apple Spacing */}
      <section className="py-24 border-t border-border/40 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-[-0.02em]">
              Trusted by job seekers
            </h2>
            <p className="text-lg text-muted-foreground">Join thousands who landed their dream jobs</p>
          </div>
          
          {statsLoading ? (
            <LandingStatsSkeleton />
          ) : (
            <div className="grid grid-cols-3 gap-12 text-center max-w-5xl mx-auto mb-12">
              {landingStats?.map((stat) => (
                <div key={stat.id}>
                  <div className="text-5xl font-bold text-foreground mb-2 tracking-tight">
                    {stat.stat_value}
                  </div>
                  <div className="text-base text-muted-foreground">{stat.stat_label}</div>
                </div>
              ))}
            </div>
          )}
          
          {/* Company logos */}
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-40">
            {["Google", "Apple", "Meta", "Netflix", "Amazon", "Microsoft"].map((company) => (
              <div key={company} className="text-sm font-semibold text-foreground">{company}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Apple Spacing */}
      <section className="py-24 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-[-0.02em]">
              Loved by users
            </h2>
            <p className="text-lg text-muted-foreground">See what people are saying</p>
          </div>
          
          {testimonialsLoading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <TestimonialCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials?.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.id}
                  quote={testimonial.quote}
                  name={testimonial.author_name}
                  role={testimonial.author_role}
                  company={testimonial.author_company}
                  rating={testimonial.rating}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose - Compact Grid */}
      <section className="py-12 border-t border-border/40 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-[-0.02em]">
              Why JobTracker?
            </h2>
            <p className="text-sm text-muted-foreground">Built for modern job seekers</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <BenefitCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Simple by design"
              description="No clutter. Just what you need."
              color="primary"
            />
            <BenefitCard
              icon={<TrendingUp className="h-5 w-5" />}
              title="Lightning fast"
              description="Instant. Smooth. Responsive."
              color="success"
            />
            <BenefitCard
              icon={<Target className="h-5 w-5" />}
              title="Results driven"
              description="Clear insights. Better outcomes."
              color="highlight"
            />
          </div>
        </div>
      </section>

      {/* Final CTA - Apple Spacing */}
      <section className="py-28 border-t border-border/40">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-[-0.02em]">
            Ready to start?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands transforming their job search.
          </p>
          <Link to="/signup">
            <Button className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-white hover:opacity-90 rounded-full px-10 h-14 text-base font-medium shadow-lg">
              Try JobTracker free
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-6">No credit card required • Free forever</p>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-8 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-foreground">
                <Briefcase className="h-3 w-3 text-background" />
              </div>
              <span className="text-xs font-medium text-foreground">JobTracker</span>
            </div>
            
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <button className="hover:text-foreground transition-colors">Privacy</button>
              <button className="hover:text-foreground transition-colors">Terms</button>
              <button className="hover:text-foreground transition-colors">Contact</button>
            </div>
            
            <p className="text-xs text-muted-foreground">© 2024 JobTracker</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon, 
  value, 
  label, 
  color 
}: { 
  icon: React.ReactNode; 
  value: string; 
  label: string; 
  color: string;
}) {
  const colorStyles: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <div className="h-20 bg-card rounded-lg border border-border/50 p-3 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer">
      <div className={`h-5 w-5 rounded flex items-center justify-center ${colorStyles[color]}`}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-foreground leading-none mb-1">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({ title, count, color }: { title: string; count: number; color: string }) {
  const colorStyles: Record<string, string> = {
    muted: "bg-muted",
    primary: "bg-primary/10",
    success: "bg-success/10",
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`${colorStyles[color]} rounded-lg p-2 flex items-center justify-between`}>
        <span className="text-[9px] font-semibold text-foreground">{title}</span>
        <span className="text-[8px] text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded-full">{count}</span>
      </div>
      {[...Array(Math.min(count, 3))].map((_, i) => (
        <div key={i} className="bg-card rounded border border-border/50 p-1.5 hover:shadow-sm transition-shadow cursor-pointer">
          <div className="h-1.5 w-full bg-muted rounded mb-1" />
          <div className="h-1 w-3/4 bg-muted/50 rounded" />
        </div>
      ))}
    </div>
  );
}

// Job Card Component
function JobCard({ company, role, salary, location }: { company: string; role: string; salary: string; location: string }) {
  return (
    <div className="bg-card rounded-lg border border-border/50 p-3 hover:shadow-md transition-all cursor-pointer group">
      <div className="flex items-start gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
          {company.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground text-xs mb-0.5 truncate">{role}</div>
          <div className="text-[10px] text-primary font-medium mb-1">{company}</div>
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
            <div className="flex items-center gap-0.5">
              <DollarSign className="h-2.5 w-2.5" />
              <span>{salary}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />
              <span>{location}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureBlock({ 
  icon, 
  title, 
  description,
  color = "primary"
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color?: "primary" | "success" | "highlight";
}) {
  const colorStyles = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    highlight: "bg-highlight/10 text-highlight-foreground",
  };

  return (
    <div className="text-center">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-6 ${colorStyles[color]}`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-base text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function BenefitCard({ 
  icon, 
  title, 
  description,
  color = "primary"
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color?: "primary" | "success" | "highlight";
}) {
  const colorStyles = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    highlight: "bg-highlight/10 text-highlight-foreground",
  };

  return (
    <div className="text-center">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center mx-auto mb-3 ${colorStyles[color]}`}>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function TestimonialCard({
  quote,
  name,
  role,
  company,
  rating = 5
}: {
  quote: string;
  name: string;
  role: string;
  company: string;
  rating?: number;
}) {
  return (
    <div className="bg-card rounded-lg border border-border/50 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2 mb-4">
        <div className="flex gap-0.5">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-warning text-warning" />
          ))}
        </div>
      </div>
      <p className="text-base text-foreground mb-4 leading-relaxed">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-500" />
        <div>
          <div className="text-sm font-semibold text-foreground">{name}</div>
          <div className="text-xs text-muted-foreground">{role}, {company}</div>
        </div>
      </div>
    </div>
  );
}
