import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, Link, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  BarChart3,
  TrafficCone,
  Play,
  Bell,
  Settings,
  AlertTriangle,
  Upload,
  LogOut,
  Volume2,
  Sun,
  Moon,
} from "lucide-react";
import { getAlerts } from "../lib/api";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Live Feed", path: "/live-feed", icon: Video },
  { title: "Analytics", path: "/analytics", icon: BarChart3 },
  { title: "Signals", path: "/signals", icon: TrafficCone },
  { title: "Simulation", path: "/simulation", icon: Play },
  { title: "Alerts", path: "/alerts", icon: Bell },
  { title: "Upload Video", path: "/upload-video", icon: Upload },
  { title: "Settings", path: "/settings", icon: Settings },
];

const pageTitles: Record<string, string> = {
  "/": "Dashboard Overview",
  "/live-feed": "Live CCTV Feed",
  "/analytics": "Traffic Analytics",
  "/signals": "Signal Control",
  "/simulation": "Traffic Simulation",
  "/alerts": "Alerts & Notifications",
  "/upload-video": "Upload Traffic Video",
  "/settings": "Settings",
  "/profile": "Admin Identity Matrix",
};

interface AlertItem {
  id: number;
  is_read: boolean;
}

export default function DashboardLayout() {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [systemHealth, setSystemHealth] = useState<'healthy'|'degraded'|'critical'>('healthy');

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // JARVIS Voice Tracking Ref
  const lastSpokenAlertId = useRef(0);
  const [activeAlarm, setActiveAlarm] = useState<string | null>(null);
  const isAlarmActive = useRef(false);

  const playJarvisUtterance = (message: string) => {
    if (!("speechSynthesis" in window) || !isAlarmActive.current) return;
    
    window.speechSynthesis.cancel(); // Clear strict queue
    
    const utterance = new SpeechSynthesisUtterance(message);
    const voices = window.speechSynthesis.getVoices();
    
    const idealVoice = voices.find(v => v.name.includes("Google") && v.name.includes("Male")) 
                    || voices.find(v => v.name.includes("Siri"))
                    || voices.find(v => v.lang === "en-GB")
                    || voices[0];
                    
    if (idealVoice) utterance.voice = idealVoice;
    utterance.rate = 1.05; 
    utterance.pitch = 0.95; 

    utterance.onend = () => {
      // If the user hasn't clicked acknowledge, loop the alarm
      if (isAlarmActive.current) {
        setTimeout(() => playJarvisUtterance(message), 1500);
      }
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const triggerJarvisAlarm = (message: string) => {
    if (isAlarmActive.current) return; // Prevent overlapping alarms
    isAlarmActive.current = true;
    setActiveAlarm(message);
    playJarvisUtterance(message);
  };

  const acknowledgeAlarm = () => {
    isAlarmActive.current = false;
    setActiveAlarm(null);
    window.speechSynthesis.cancel();
  };

  useEffect(() => {
    if (!role) {
      navigate("/login");
    }
  }, [role, navigate]);

  useEffect(() => {
    if (role === "user" && currentPath !== "/" && currentPath !== "/analytics" && currentPath !== "/profile") {
      navigate("/");
    }
  }, [role, currentPath, navigate]);

  const filteredNavItems = useMemo(() => {
    if (role === "user") {
      return navItems.filter(item => item.path === "/" || item.path === "/analytics");
    }
    return navItems;
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const loadAlerts = async () => {
    try {
      const res = await getAlerts();
      const alertData = res.data || [];
      setAlerts(alertData);

      // JARVIS Speech Synth for new unread alerts
      if (alertData.length > 0) {
        const latestInfo = alertData[0];
        
        // Ensure browser parses IDs safely
        const incomingId = latestInfo.id || new Date(latestInfo.created_at).getTime(); 

        if (incomingId > lastSpokenAlertId.current) {
          if (latestInfo.severity === "critical" || latestInfo.severity === "warning" || latestInfo.severity === "severe") {
             triggerJarvisAlarm(`Critical Warning: ${latestInfo.title}. Awaiting operator acknowledgment.`);
          }
          lastSpokenAlertId.current = incomingId;
        }
      }
    } catch (err) {
      console.error("Layout alerts fetch error:", err);
    }
  };

  const checkLiveHealth = async () => {
    try {
      const ping = await fetch("http://localhost:5000/api/health", { method: 'GET' });
      if (ping.status === 200) setSystemHealth('healthy');
      else if (ping.status === 503) setSystemHealth('critical');
      else setSystemHealth('degraded');
    } catch (e) {
      setSystemHealth('critical');
    }
  };

  useEffect(() => {
    loadAlerts();
    checkLiveHealth();

    const interval = setInterval(() => {
      loadAlerts();
      checkLiveHealth();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const unreadCount = useMemo(
    () => alerts.filter((alert) => !alert.is_read).length,
    [alerts]
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background relative isolate">
      {/* THE WOW MOMENT: Bioluminescent Ambient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blob-teal blur-[120px] animate-blob mix-blend-screen opacity-60 -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blob-violet blur-[120px] animate-blob mix-blend-screen opacity-60 -z-10" style={{ animationDelay: "5s" }}></div>
      <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full blob-teal blur-[100px] animate-blob mix-blend-screen opacity-40 -z-10" style={{ animationDelay: "2s" }}></div>

      <aside className="w-[280px] shrink-0 bg-background/40 backdrop-blur-3xl border-r border-white/5 flex flex-col z-10 relative">
        <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
        
        <div className="h-20 flex items-center px-8">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mr-4 glow-green">
            <TrafficCone className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
          </div>
          <span className="text-foreground font-display font-bold text-2xl tracking-tighter">TrafficAI<span className="text-primary">.</span></span>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2">
          {filteredNavItems.map((item) => {
            const active = currentPath === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                  active
                    ? "text-primary bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full glow-green animate-in-fade" />
                )}
                <item.icon className={`h-5 w-5 transition-transform duration-300 ${active ? "drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" : "group-hover:scale-110"}`} />
                <span className="tracking-wide relative z-10">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden z-10 relative">
        {/* CRITICAL ALARM BANNER */}
        {activeAlarm && (
          <div className="absolute top-0 left-0 right-0 bg-destructive/95 backdrop-blur-xl border-b border-white/20 text-white p-3 px-10 flex items-center justify-between z-[60] shadow-[0_5px_30px_rgba(255,0,0,0.5)] animate-in-slide">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 animate-pulse drop-shadow-md" />
              <span className="font-display font-medium tracking-wide uppercase text-sm drop-shadow-md">{activeAlarm}</span>
            </div>
            <button 
              onClick={acknowledgeAlarm}
              className="px-6 py-2 bg-black/50 hover:bg-black/80 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors border border-white/20 shadow-lg text-white"
            >
              Acknowledge & Silence
            </button>
          </div>
        )}

        <header className="h-20 shrink-0 bg-background/20 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-10 relative">
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          
          <h1 className="text-xl font-display font-semibold text-foreground tracking-tight animate-in-slide">
            {pageTitles[currentPath] || "Dashboard"}
          </h1>

          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border ${
              systemHealth === 'healthy' 
                ? 'border-primary/20 bg-primary/5 text-primary' 
                : systemHealth === 'degraded' 
                  ? 'border-orange-500/20 bg-orange-500/5 text-orange-500' 
                  : 'border-destructive/20 bg-destructive/5 text-destructive animate-pulse'
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                 systemHealth === 'healthy' ? 'bg-primary animate-pulse-glow' 
                 : systemHealth === 'degraded' ? 'bg-orange-500' 
                 : 'bg-destructive shadow-[0_0_10px_rgba(255,0,0,0.8)]'
              }`} />
              <span className="font-bold uppercase tracking-widest text-[10px]">
                 {systemHealth === 'healthy' ? `System Core (${role})` : systemHealth === 'degraded' ? 'Matrix Degraded' : 'DB ISOLATED'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-destructive border-r border-border pr-6">
              <AlertTriangle className="h-4 w-4" />
              <span>{unreadCount} Alerts</span>
            </div>

            <Link
              to="/profile"
              className="flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-background-tertiary hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </Link>

            <button
              onClick={() => triggerJarvisAlarm("JARVIS audio system online. Critical simulation in progress.")}
              className="flex items-center justify-center p-2 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
              title="Test Looping JARVIS Audio System"
            >
              <Volume2 className="h-4 w-4" />
            </button>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-background-tertiary transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}