import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created!",
        description: "Welcome to JobTracker. Let's land your dream job!",
      });
      navigate("/dashboard");
    }

    setLoading(false);
  };

  const benefits = [
    "Track unlimited job applications",
    "Visual dashboard & analytics",
    "Never miss an interview",
    "100% free to use",
  ];

  return (
    <div className="min-h-screen bg-background bg-grid relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-highlight/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      
      {/* Floating shapes */}
      <div className="absolute top-32 left-20 w-24 h-24 border-2 border-primary/20 rounded-2xl -rotate-12 animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-32 right-20 w-16 h-16 bg-highlight/30 rounded-full animate-float" style={{ animationDelay: "3s" }} />
      <div className="absolute top-1/2 right-10 w-12 h-12 bg-success/20 rounded-lg rotate-45 animate-float" style={{ animationDelay: "0.5s" }} />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-soft">
                <Briefcase className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">JobTracker</span>
            </Link>
          </div>

          {/* Card */}
          <div className="glass-card rounded-3xl p-8 shadow-card">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Create your account ✨
              </h1>
              <p className="text-muted-foreground">
                Start organizing your job search today
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12 bg-muted/50 border-border focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-muted/50 border-border focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-muted/50 border-border focus:border-primary focus:ring-primary"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 gradient-primary border-0 shadow-soft text-lg font-semibold"
              >
                {loading ? "Creating account..." : "Create Account"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 text-foreground">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-highlight/20 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-highlight-foreground" />
                </div>
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
