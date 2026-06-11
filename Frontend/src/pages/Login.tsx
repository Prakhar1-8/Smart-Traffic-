import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { TrafficCone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { login } from "@/lib/api";
import { toast } from "sonner";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(username, password);
      if (data.success) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("role", data.data.role);
        localStorage.removeItem("isDataAvailable");
        toast.success(`Logged in as ${data.data.role}`);
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch (err) {
      toast.error("An error occurred during login.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8 space-y-2">
          <div className="p-3 bg-primary/20 rounded-full">
            <TrafficCone className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">TrafficAI</h1>
          <p className="text-muted-foreground text-sm">Smart Traffic Management System</p>
        </div>

        <Card className="border-border/50 bg-background-secondary/50 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="admin or user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-background-tertiary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background-tertiary/50"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button type="submit" className="w-full font-semibold" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Don't have an account? <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
