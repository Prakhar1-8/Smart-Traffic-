import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { TrafficCone, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { register, sendOtp } from "@/lib/api";
import { toast } from "sonner";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    dob: "",
    gender: "",
    email: "",
    phone: "",
    location: "",
    otp: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const requestOtp = async () => {
    if (!formData.phone || formData.phone.length < 5) {
      return toast.error("Please insert a valid phone sequence first");
    }
    setLoading(true);
    try {
      const resp = await sendOtp(formData.phone);
      if (resp.success) {
        toast.info("Simulated OTP sent via Twilio Gateway (Check Server Logs)");
        setOtpSent(true);
      } else {
        toast.error("Failed to generate OTP request.");
      }
    } catch (err) {
      toast.error("An error occurred trying to connect to the SMS gateway.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) return toast.error("You must request an OTP transmission first.");
    
    setLoading(true);
    try {
      const data = await register(formData);
      if (data.success) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("role", data.data.role);
        toast.success(`Account minted natively! Authorized as ${data.data.role}`);
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Registration validation tripped centrally");
      }
    } catch (err) {
      toast.error("A critical communication failure occurred during registry creation.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 py-12">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="relative z-10 w-full max-w-2xl">
        <div className="flex flex-col items-center mb-6 space-y-2">
          <div className="p-3 bg-primary/20 rounded-full">
            <TrafficCone className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">TrafficAI</h1>
          <p className="text-muted-foreground text-sm">Join the Smart Management Network</p>
        </div>

        <Card className="border-border/50 bg-background-secondary/50 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle>Demographics Profile Entry</CardTitle>
            <CardDescription>We strictly require phone validation to configure physical operators</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-2">
                <Label htmlFor="username">Root Username <span className="text-destructive">*</span></Label>
                <Input id="username" placeholder="e.g. traffic_analyst" value={formData.username} onChange={handleInputChange} required className="bg-background-tertiary/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Passkey Vector <span className="text-destructive">*</span></Label>
                <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} required className="bg-background-tertiary/50" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="full_name">Legal Full Name</Label>
                <Input id="full_name" placeholder="John Doe" value={formData.full_name} onChange={handleInputChange} className="bg-background-tertiary/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={formData.dob} onChange={handleInputChange} className="bg-background-tertiary/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender Sequence</Label>
                <select id="gender" value={formData.gender} onChange={handleInputChange as any} className="flex h-9 w-full rounded-md border border-input bg-background-tertiary/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="">Opt out of parameter</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Location</Label>
                <Input id="email" type="email" placeholder="example@node.com" value={formData.email} onChange={handleInputChange} className="bg-background-tertiary/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">System Zone Region</Label>
                <Input id="location" placeholder="City, Station ID" value={formData.location} onChange={handleInputChange} className="bg-background-tertiary/50" />
              </div>

              {/* OTP TELEPHONE VERIFICATION BLOCK */}
              <div className="space-y-2 md:col-span-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Label htmlFor="phone" className="text-primary font-medium">Telephone Sync <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <Input id="phone" type="tel" placeholder="+1 000 000 0000" value={formData.phone} onChange={handleInputChange} required className="bg-background flex-1 border-primary/30" />
                  <Button type="button" variant="outline" onClick={requestOtp} disabled={loading || otpSent} className="border-primary/50 text-primary hover:bg-primary/10">
                     {otpSent ? "Transmitted" : <><Send className="w-4 h-4 mr-2"/> Request OTP</>}
                  </Button>
                </div>
                {otpSent && (
                  <div className="pt-3 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="otp" className="text-foreground text-xs uppercase font-bold tracking-wider mb-1 block">Enter Twilio Auth Hash</Label>
                    <Input id="otp" placeholder="6-Digit Signature" value={formData.otp} onChange={handleInputChange} required className="bg-background-tertiary/50 border-input text-center tracking-[0.5em] font-mono font-bold" maxLength={6}/>
                  </div>
                )}
              </div>

            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button type="submit" className="w-full font-bold uppercase tracking-wider" disabled={loading || !otpSent}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Deploy Identity Key"}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Already hold an infrastructure node? <Link to="/login" className="text-primary font-medium hover:underline">Log in securely</Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
