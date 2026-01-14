import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart3,
  Table,
  Star
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">
              JobTracker
            </span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="gradient-primary border-0 shadow-soft">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-grid">
        {/* Background decoration */}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-highlight/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        
        {/* Floating elements */}
        <div className="absolute top-40 right-20 w-20 h-20 border-2 border-highlight/40 rounded-xl rotate-12 animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-40 left-20 w-16 h-16 bg-highlight/30 rounded-full animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/3 left-10 w-8 h-8 bg-primary/30 rounded-lg rotate-45 animate-float" style={{ animationDelay: "0.5s" }} />
        
        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-highlight/20 text-highlight-foreground text-sm font-medium border border-highlight/30">
              <Sparkles className="h-4 w-4" />
              Finally, a tracker you'll actually enjoy using
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold text-foreground leading-tight tracking-tight">
              Track your job applications{" "}
              <span className="highlight-text">without the stress</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Ditch the messy spreadsheets and confusing Notion templates. 
              JobTracker is the modern, beautiful way to organize your job search 
              and land your dream role.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/signup">
                <Button size="lg" className="gradient-highlight border-0 shadow-glow text-highlight-foreground text-lg px-8 py-6 h-auto font-semibold">
                  Start Tracking Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-2">
                See How It Works
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground pt-2">
              No credit card required • Set up in 30 seconds
            </p>
          </div>

          {/* Feature Preview Cards */}
          <div className="mt-20 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <FeatureCard 
              icon={Table}
              title="Smart Table View"
              description="Track every application with a beautiful, sortable table. Filter by status, company, or date."
              color="primary"
            />
            <FeatureCard 
              icon={BarChart3}
              title="Visual Dashboard"
              description="See your progress at a glance with charts, stats, and motivating insights."
              color="highlight"
            />
            <FeatureCard 
              icon={Calendar}
              title="Interview Calendar"
              description="Never miss an interview. All your important dates in one beautiful calendar."
              color="success"
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-card border-y border-border relative">
        <div className="absolute inset-0 bg-grid-dots opacity-30" />
        <div className="container relative mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <StatItem value="10,000+" label="Active Users" />
            <StatItem value="250,000+" label="Jobs Tracked" />
            <StatItem value="85%" label="Success Rate" />
            <StatItem value="4.9★" label="User Rating" />
          </div>
        </div>
      </section>

      {/* Why Switch Section */}
      <section className="py-24 bg-grid">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-highlight/20 text-highlight-foreground text-sm font-medium mb-4 border border-highlight/30">
              <Star className="h-4 w-4" />
              Why make the switch?
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why job seekers love <span className="highlight-text">JobTracker</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Built by job seekers, for job seekers. We know exactly what you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <BenefitCard 
              icon={CheckCircle2}
              title="Replace messy spreadsheets"
              description="No more endless columns and broken formulas. Everything is organized and beautiful."
            />
            <BenefitCard 
              icon={TrendingUp}
              title="Stay motivated"
              description="Track your progress with visual charts. Celebrate wins and stay focused."
            />
            <BenefitCard 
              icon={Calendar}
              title="Never miss a deadline"
              description="Automatic reminders for follow-ups and interviews. Stay on top of everything."
            />
            <BenefitCard 
              icon={Sparkles}
              title="Designed to delight"
              description="A tool so beautiful you'll actually want to use it every day."
            />
            <BenefitCard 
              icon={BarChart3}
              title="Actionable insights"
              description="See which strategies work. Learn from your data and improve."
            />
            <BenefitCard 
              icon={Briefcase}
              title="All-in-one hub"
              description="Notes, documents, and contacts in one place for each application."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary via-primary to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        
        {/* Floating highlight accents */}
        <div className="absolute top-10 right-10 w-24 h-24 bg-highlight/30 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-highlight/20 rounded-full blur-xl animate-float" style={{ animationDelay: "2s" }} />
        
        <div className="container relative mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-4">
            Ready to organize your job search?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of job seekers who landed their dream roles with JobTracker.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-highlight text-highlight-foreground hover:bg-highlight/90 text-lg px-8 py-6 h-auto shadow-glow font-semibold">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">JobTracker</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 JobTracker. Built with ❤️ for job seekers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  color 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  color: "primary" | "success" | "highlight";
}) {
  const colorStyles = {
    primary: "bg-secondary text-primary",
    success: "bg-success-light text-success",
    highlight: "bg-highlight/20 text-highlight-foreground",
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card hover:shadow-hover transition-all duration-300 animate-fade-in border border-border">
      <div className={`inline-flex p-3 rounded-xl mb-4 ${colorStyles[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-bold text-highlight">{value}</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

function BenefitCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex gap-4 p-6 rounded-xl hover:bg-highlight/5 transition-colors border border-transparent hover:border-highlight/20">
      <div className="flex-shrink-0">
        <div className="h-10 w-10 rounded-xl bg-highlight/20 flex items-center justify-center">
          <Icon className="h-5 w-5 text-highlight-foreground" />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
