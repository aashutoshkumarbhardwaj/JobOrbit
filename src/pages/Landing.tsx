import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  Star,
  Github,
  ExternalLink
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
    // Hero animation - with null guards
    if (heroRef.current?.children) {
      gsap.from(heroRef.current.children, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out"
      });
    }

    // Stats animation on scroll - with null guards
    if (statsRef.current?.children) {
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

    // Chart bars animation - with null guards
    if (chartRef.current) {
      const bars = chartRef.current.querySelectorAll('.chart-bar');
      if (bars.length > 0) {
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
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative transition-colors duration-300">
      {/* Animated glassmorphism background orbs - Light/Dark Theme */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Light theme orbs */}
        <div className="dark:hidden absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0s', animationDuration: '8s'}} />
        <div className="dark:hidden absolute top-1/2 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-secondary/10 via-muted/10 to-primary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s', animationDuration: '10s'}} />
        <div className="dark:hidden absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-gradient-to-tr from-muted/10 via-primary/10 to-secondary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s', animationDuration: '12s'}} />
        
        {/* Dark theme orbs */}
        <div className="hidden dark:block absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-primary/20 via-primary/15 to-secondary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0s', animationDuration: '8s'}} />
        <div className="hidden dark:block absolute top-1/2 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-secondary/20 via-muted/15 to-primary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s', animationDuration: '10s'}} />
        <div className="hidden dark:block absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-gradient-to-tr from-muted/20 via-primary/20 to-secondary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s', animationDuration: '12s'}} />
      </div>
      {/* Enhanced Glassmorphism Navigation - Light/Dark Theme */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg dark:shadow-black/20">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all duration-300">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">JobTracker</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Enhanced GitHub Star Button */}
            {/* <a 
              href="" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-background/60 hover:bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg dark:bg-background/40 dark:hover:bg-background/60"
            >
              <Github className="h-4 w-4 text-foreground" />
              <span className="text-xs font-medium text-foreground">Star</span>
            </a> */}
            
            {/* Enhanced Product Hunt Button */}
            <a 
              href="#" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-orange-50/80 hover:bg-orange-100/80 dark:bg-orange-950/50 dark:hover:bg-orange-950/70 backdrop-blur-xl border border-orange-200/50 dark:border-orange-800/50 rounded-xl transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
            >
              <div className="h-4 w-4 bg-orange-500 rounded-sm flex items-center justify-center">
                <ExternalLink className="h-2 w-2 text-white" />
              </div>
              <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Hunt</span>
            </a>
            
            <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105">Sign in</Link>
            <Link to="/signup">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 h-8 text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:scale-105">
                Try free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Enhanced Hero with Glassmorphism - Light/Dark Theme */}
      <section className="pt-28 pb-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-5xl mx-auto text-center" ref={heroRef}>
            {/* Enhanced badge with glassmorphism - Light/Dark Theme */}
            <div className="inline-flex items-center gap-3 bg-background/80 backdrop-blur-xl border border-border/50 px-6 py-3 rounded-2xl mb-12 font-medium text-sm tracking-wider shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 dark:bg-background/60 dark:border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-ping" />
                <div className="w-3 h-3 bg-primary rounded-full" />
              </div>
              <span className="text-primary font-bold">Track smarter, not harder</span>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            
            {/* Enhanced headline - Light/Dark Theme */}
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black leading-[1.05] tracking-[-0.03em] mb-8">
              <span className="text-foreground">Your job search.</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                Beautifully organized.
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-12 font-light">
              Track applications, schedule interviews, and land your dream job with the most <span className="text-primary font-bold">intuitive</span> tracker ever made.
            </p>
            
            {/* Enhanced CTA buttons - Light/Dark Theme */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
              <Link to="/signup">
                <Button className="group relative bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:shadow-primary/20 h-16 px-12 rounded-2xl text-xl font-bold transition-all duration-500 hover:scale-105 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center">
                    Get started
                    <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                </Button>
              </Link>
              <button className="group relative flex items-center gap-3 bg-background/80 hover:bg-background border border-border/50 px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-500 hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-xl dark:bg-background/60 dark:border-border/30">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <div className="h-5 w-5 bg-primary-foreground rounded-sm ml-0.5" />
                </div>
                <div className="text-left">
                  <div className="text-foreground font-bold">Watch demo</div>
                  <div className="text-muted-foreground text-sm">45 seconds</div>
                </div>
              </button>
            </div>
            
            {/* Enhanced trust badges with glassmorphism - Light/Dark Theme */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 bg-background/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-border/50 dark:bg-background/40 dark:border-border/30">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-foreground font-medium">Free forever</span>
              </div>
              <div className="flex items-center gap-3 bg-background/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-border/50 dark:bg-background/40 dark:border-border/30">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-foreground font-medium">No credit card</span>
              </div>
              <div className="flex items-center gap-3 bg-background/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-border/50 dark:bg-background/40 dark:border-border/30">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-foreground font-medium">2 min setup</span>
              </div>
              <div className="flex items-center gap-3 bg-background/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-border/50 dark:bg-background/40 dark:border-border/30">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <Star className="h-4 w-4 fill-primary text-primary" />
                </div>
                <span className="text-foreground font-medium">4.9/5 rating</span>
              </div>
            </div>
          </div>

          {/* Enhanced Interactive Product Preview with Glassmorphism - Light/Dark Theme */}
          <div className="max-w-6xl mx-auto mt-20">
            <div className="relative bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-xl dark:bg-background/60 dark:border-border/30">
              <div className="aspect-[16/9] bg-gradient-to-br from-background via-background to-muted/20 p-10">
                <div className="h-full rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 p-8 flex flex-col gap-6 dark:bg-background/40 dark:border-border/30">
                  {/* Enhanced Header with Glassmorphism - Light/Dark Theme */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 rounded-xl bg-primary shadow-lg shadow-primary/20 animate-pulse" />
                      <span className="text-lg font-bold text-foreground">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-2 bg-primary/10 rounded-full border border-primary/20">
                      <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                      <span className="text-sm font-bold text-primary">12 Active</span>
                    </div>
                  </div>
                  
                  {/* Enhanced Stats Grid with Glassmorphism - Light/Dark Theme */}
                  <div className="grid grid-cols-4 gap-4" ref={statsRef}>
                    <div className="group p-6 rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 hover:bg-background/80 transition-all duration-300 hover:scale-105 dark:bg-background/40 dark:border-border/30">
                      <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center mb-3">
                        <Briefcase className="h-3 w-3 text-primary-foreground" />
                      </div>
                      <div className="text-2xl font-black text-foreground mb-1">24</div>
                      <div className="text-xs text-primary font-medium">Applied</div>
                    </div>
                    <div className="group p-6 rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 hover:bg-background/80 transition-all duration-300 hover:scale-105 dark:bg-background/40 dark:border-border/30">
                      <div className="h-6 w-6 rounded-lg bg-success flex items-center justify-center mb-3">
                        <Calendar className="h-3 w-3 text-success-foreground" />
                      </div>
                      <div className="text-2xl font-black text-foreground mb-1">8</div>
                      <div className="text-xs text-success font-medium">Interviews</div>
                    </div>
                    <div className="group p-6 rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 hover:bg-background/80 transition-all duration-300 hover:scale-105 dark:bg-background/40 dark:border-border/30">
                      <div className="h-6 w-6 rounded-lg bg-warning flex items-center justify-center mb-3">
                        <Star className="h-3 w-3 text-warning-foreground" />
                      </div>
                      <div className="text-2xl font-black text-foreground mb-1">3</div>
                      <div className="text-xs text-warning font-medium">Offers</div>
                    </div>
                    <div className="group p-6 rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 hover:bg-background/80 transition-all duration-300 hover:scale-105 dark:bg-background/40 dark:border-border/30">
                      <div className="h-6 w-6 rounded-lg bg-secondary flex items-center justify-center mb-3">
                        <TrendingUp className="h-3 w-3 text-secondary-foreground" />
                      </div>
                      <div className="text-2xl font-black text-foreground mb-1">85%</div>
                      <div className="text-xs text-secondary font-medium">Response</div>
                    </div>
                  </div>
                  
                  {/* Enhanced Chart with Glassmorphism - Light/Dark Theme */}
                  <div className="flex-1 bg-background/40 backdrop-blur-xl rounded-2xl border border-border/50 p-6 dark:bg-background/30 dark:border-border/30" ref={chartRef}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-muted-foreground">Weekly Activity</span>
                      <span className="text-sm font-bold text-primary">+12% this week</span>
                    </div>
                    <div className="h-full flex items-end justify-between gap-3">
                      {[
                        { height: 35, label: "Mon" },
                        { height: 55, label: "Tue" },
                        { height: 40, label: "Wed" },
                        { height: 70, label: "Thu" },
                        { height: 50, label: "Fri" },
                        { height: 80, label: "Sat" },
                        { height: 65, label: "Sun" }
                      ].map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <div 
                            className="chart-bar w-full bg-gradient-to-t from-primary/60 via-primary/80 to-primary/60 rounded-t-lg transition-all duration-300 hover:from-primary/80 hover:via-primary/100 hover:to-primary/80 cursor-pointer hover:scale-110" 
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

      {/* Enhanced Social Proof Section with Glassmorphism - Light/Dark Theme */}
      <section className="py-16 border-y border-border/50 bg-muted/30 dark:bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Enhanced GitHub Stats */}
            <div className="flex items-center gap-6">
              <a 
                href="https://github.com/yourusername/jobtracker" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 group"
              >
                <div className="flex items-center gap-3 px-6 py-3 bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl hover:border-primary/50 transition-all duration-300 hover:scale-105 dark:bg-background/60 dark:border-border/30">
                  <Github className="h-6 w-6 text-foreground" />
                  <div className="text-right">
                    <div className="text-lg font-black text-foreground">1.2k</div>
                    <div className="text-xs text-primary">Stars</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                  Star us on GitHub
                </div>
              </a>
            </div>

            {/* Enhanced Product Hunt Badge */}
            <div className="flex items-center gap-6">
              <a 
                href="https://www.producthunt.com/posts/jobtracker" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 group"
              >
                <div className="flex items-center gap-3 px-6 py-3 bg-orange-50/80 backdrop-blur-xl border border-orange-200/50 rounded-xl hover:border-orange-300/50 transition-all duration-300 hover:scale-105 dark:bg-orange-950/50 dark:border-orange-800/50">
                  <div className="h-6 w-6 bg-orange-500 rounded-sm flex items-center justify-center">
                    <ExternalLink className="h-3 w-3 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-orange-700 dark:text-orange-300">#3</div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">Product of Day</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors font-medium">
                  Featured on Product Hunt
                </div>
              </a>
            </div>

            {/* Enhanced Community */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">10k+</span> users
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features with Glassmorphism - Light/Dark Theme */}
      <section className="py-32 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 bg-background/80 backdrop-blur-xl border border-border/50 px-6 py-3 rounded-2xl mb-8 font-medium text-sm tracking-wider dark:bg-background/60 dark:border-border/30">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary font-bold">Powerful features</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-foreground mb-6 tracking-[-0.02em]">
              Everything you need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">Powerful features that make job tracking effortless</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="group p-10 bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl hover:bg-background hover:border-border transition-all duration-500 hover:scale-105 hover:shadow-xl dark:bg-background/60 dark:border-border/30">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4">Insights that matter</h3>
              <p className="text-muted-foreground leading-relaxed">Beautiful analytics show you what's working. Make smarter decisions faster.</p>
            </div>
            <div className="group p-10 bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl hover:bg-background hover:border-border transition-all duration-500 hover:scale-105 hover:shadow-xl dark:bg-background/60 dark:border-border/30">
              <div className="h-12 w-12 rounded-xl bg-success flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-6 w-6 text-success-foreground" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4">Never miss a beat</h3>
              <p className="text-muted-foreground leading-relaxed">All your interviews and deadlines in one elegant calendar view.</p>
            </div>
            <div className="group p-10 bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl hover:bg-background hover:border-border transition-all duration-500 hover:scale-105 hover:shadow-xl dark:bg-background/60 dark:border-border/30">
              <div className="h-12 w-12 rounded-xl bg-warning flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-6 w-6 text-warning-foreground" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4">Effortlessly simple</h3>
              <p className="text-muted-foreground leading-relaxed">Every detail refined. Every interaction considered. Just works.</p>
            </div>
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

      {/* Enhanced Final CTA with Glassmorphism - Light/Dark Theme */}
      <section className="py-32 border-t border-border/50 bg-muted/30 dark:bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-3 bg-background/80 backdrop-blur-xl border border-border/50 px-6 py-3 rounded-2xl mb-12 font-medium text-sm tracking-wider dark:bg-background/60 dark:border-border/30">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-primary font-bold">Start your journey today</span>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-black text-foreground mb-8 tracking-[-0.02em]">
            Ready to land your
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              dream job?
            </span>
          </h2>
          
          <p className="text-2xl text-muted-foreground mb-16 max-w-3xl mx-auto leading-relaxed">
            Join thousands of job seekers who've transformed their job search with JobTracker. Track smarter, apply better, land faster.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-12">
            <Link to="/signup">
              <Button className="group relative bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:shadow-primary/20 h-20 px-16 rounded-3xl text-2xl font-black transition-all duration-500 hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center">
                  Get started free
                  <ArrowRight className="h-6 w-6 ml-4 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-3 bg-background/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-border/50 dark:bg-background/40 dark:border-border/30">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">No credit card</span>
            </div>
            <div className="flex items-center gap-3 bg-background/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-border/50 dark:bg-background/40 dark:border-border/30">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">Free forever</span>
            </div>
            <div className="flex items-center gap-3 bg-background/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-border/50 dark:bg-background/40 dark:border-border/30">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">Cancel anytime</span>
            </div>
          </div>
          
          {/* Enhanced final social proof - Light/Dark Theme */}
          <div className="flex items-center justify-center gap-12 mt-16 text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <span>Join <span className="font-bold text-foreground">10,000+</span> users</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <Star className="h-4 w-4 fill-primary text-primary" />
              <Star className="h-4 w-4 fill-primary text-primary" />
              <Star className="h-4 w-4 fill-primary text-primary" />
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="ml-2 font-bold text-foreground">4.9/5</span>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer with Glassmorphism - Light/Dark Theme */}
      <footer className="py-12 border-t border-border/50 bg-muted/20 dark:bg-muted/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground">JobTracker</span>
            </div>
            
            <div className="flex items-center gap-8 text-xs text-muted-foreground">
              <button className="hover:text-foreground transition-colors font-medium">Privacy</button>
              <button className="hover:text-foreground transition-colors font-medium">Terms</button>
              <button className="hover:text-foreground transition-colors font-medium">Contact</button>
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
