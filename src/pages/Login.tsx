import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { Briefcase, Mail, Lock, ArrowRight, Sparkles, Github, Chrome } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { signInWithEmail, signInWithGoogle, signInWithGitHub } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmail({ email, password });
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      navigate("/dashboard");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to sign in";
      setError(errorMsg);
      toast({
        title: "Error signing in",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setOauthLoading("google");
    try {
      await signInWithGoogle();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Google sign in failed";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setOauthLoading(null);
    }
  };

  const handleGitHubSignIn = async () => {
    setError(null);
    setOauthLoading("github");
    try {
      await signInWithGitHub();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "GitHub sign in failed";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setOauthLoading(null);
    }
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

            {error && (
              <Alert className="mb-5 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

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
                    disabled={loading || oauthLoading !== null}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
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
                    disabled={loading || oauthLoading !== null}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || oauthLoading !== null}
                className="w-full h-12 gradient-primary border-0 shadow-soft text-lg font-semibold"
              >
                {loading ? "Signing in..." : "Sign In"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>

            {/* OAuth Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || oauthLoading !== null}
                variant="outline"
                className="h-11 border-border"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button
                type="button"
                onClick={handleGitHubSignIn}
                disabled={loading || oauthLoading !== null}
                variant="outline"
                className="h-11 border-border"
              >
                <Github className="w-5 h-5 mr-2" />
                GitHub
              </Button>
            </div>

            <div className="text-center">
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
