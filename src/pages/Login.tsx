import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      navigate("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background bg-grid relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-highlight/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      
      {/* Floating shapes */}
      <div className="absolute top-40 right-20 w-20 h-20 border-2 border-highlight/30 rounded-xl rotate-12 animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-40 left-20 w-16 h-16 bg-highlight/20 rounded-full animate-float" style={{ animationDelay: "3s" }} />
      <div className="absolute top-1/3 left-10 w-8 h-8 bg-primary/20 rounded-lg rotate-45 animate-float" style={{ animationDelay: "0.5s" }} />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
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
                Welcome back! 👋
              </h1>
              <p className="text-muted-foreground">
                Sign in to continue tracking your applications
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 gradient-primary border-0 shadow-soft text-lg font-semibold"
              >
                {loading ? "Signing in..." : "Sign In"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary font-semibold hover:underline">
                  Sign up free
                </Link>
              </p>
            </div>
          </div>

          {/* Banner */}
          <div className="bg-highlight/10 border border-highlight/30 rounded-2xl p-4 flex items-center gap-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-highlight/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-highlight-foreground" />
            </div>
            <p className="text-sm text-foreground">
              <span className="font-semibold">Pro tip:</span> Track your applications daily to increase your success rate by 85%!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
