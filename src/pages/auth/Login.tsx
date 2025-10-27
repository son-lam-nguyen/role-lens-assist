import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Stethoscope, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/authContext";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);

    const result = await login(username, password);

    setIsLoading(false);

    if (result.success) {
      toast.success("Welcome back!");
      const next = searchParams.get("next") || "/sw";
      navigate(next);
    } else {
      setError(result.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fadeIn">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Stethoscope className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">SupportLens</h1>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-2">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>Access your Support Worker dashboard</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  aria-label="Username"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  aria-label="Password"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div
                  className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}

              <div className="bg-muted/50 px-3 py-2 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium mb-1">Demo credentials:</p>
                <p>Username: <span className="font-mono">support</span></p>
                <p>Password: <span className="font-mono">demo123</span></p>
              </div>

              <div className="space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/")}
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
