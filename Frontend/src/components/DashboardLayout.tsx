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
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Live Feed", path: "/live-feed", icon: Video },
  { title: "Analytics", path: "/analytics", icon: BarChart3 },
  { title: "Signals", path: "/signals", icon: TrafficCone },
  { title: "Simulation", path: "/simulation", icon: Play },
  { title: "Alerts", path: "/alerts", icon: Bell },
  { title: "Upload Video", path: "/upload-video", icon: Upload },
  { title: "Settings", path: "/settings", icon: Settings },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard Overview",
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
    if (role === "user" && currentPath !== "/dashboard" && currentPath !== "/analytics" && currentPath !== "/profile") {
      navigate("/dashboard");
    }
  }, [role, currentPath, navigate]);

  const filteredNavItems = useMemo(() => {
    if (role === "user") {
      return navItems.filter(item => item.path === "/dashboard" || item.path === "/analytics");
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

      <aside className="w-[320px] shrink-0 bg-[#0c1324]/60 backdrop-blur-3xl border-r border-[#00e5ff]/20 shadow-[4px_0_24px_rgba(0,229,255,0.05)] flex flex-col z-10 relative">
        <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-[#00e5ff]/30 to-transparent"></div>
        
        <div className="h-24 flex items-center px-10 border-b border-[#00e5ff]/10">
          <div className="w-12 h-12 rounded-xl bg-[#00e5ff]/20 border border-[#00e5ff]/40 flex items-center justify-center mr-4 shadow-[0_0_15px_rgba(0,229,255,0.4)]">
            <TrafficCone className="h-6 w-6 text-[#00e5ff] drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]" />
          </div>
          <span className="text-white font-['Space_Grotesk'] font-bold text-3xl tracking-tighter">TrafficAI<span className="text-[#00e5ff] drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">.</span></span>
        </div>

        <nav className="flex-1 py-8 px-6 space-y-3">
          {filteredNavItems.map((item) => {
            const active = currentPath === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 relative overflow-hidden ${
                  active
                    ? "text-[#00e5ff] bg-[#00e5ff]/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_15px_rgba(0,229,255,0.1)] border border-[#00e5ff]/20"
                    : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-[#00e5ff] rounded-r-full shadow-[0_0_10px_rgba(0,229,255,0.8)] animate-in-fade" />
                )}
                <item.icon className={`h-6 w-6 transition-transform duration-300 ${active ? "drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]" : "group-hover:scale-110"}`} />
                <span className="tracking-widest relative z-10 font-['Space_Grotesk'] font-medium text-sm uppercase">{item.title}</span>
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

        <header className="h-24 shrink-0 bg-[#0c1324]/80 backdrop-blur-2xl border-b border-[#00e5ff]/20 shadow-[0_4px_30px_rgba(0,229,255,0.05)] flex items-center justify-between px-10 relative">
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#00e5ff]/30 to-transparent"></div>
          
          <h1 className="text-2xl font-['Space_Grotesk'] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-white/80 drop-shadow-[0_0_10px_rgba(0,229,255,0.3)] uppercase tracking-widest animate-in-slide">
            {pageTitles[currentPath] || "Dashboard"}
          </h1>

          <div className="flex items-center gap-8">
            <div className={`flex items-center gap-3 text-sm px-4 py-2 rounded-lg border ${
              systemHealth === 'healthy' 
                ? 'border-[#00e5ff]/30 bg-[#00e5ff]/10 text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.2)]' 
                : systemHealth === 'degraded' 
                  ? 'border-orange-500/30 bg-orange-500/10 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]' 
                  : 'border-destructive/30 bg-destructive/10 text-destructive animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.2)]'
            }`}>
              <span className={`h-2.5 w-2.5 rounded-full ${
                 systemHealth === 'healthy' ? 'bg-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.8)] animate-pulse' 
                 : systemHealth === 'degraded' ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' 
                 : 'bg-destructive shadow-[0_0_10px_rgba(255,0,0,0.8)]'
              }`} />
              <span className="font-['Space_Grotesk'] font-bold uppercase tracking-widest text-[11px]">
                 {systemHealth === 'healthy' ? `System Core (${role})` : systemHealth === 'degraded' ? 'Matrix Degraded' : 'DB ISOLATED'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm text-destructive border-r border-[#00e5ff]/20 pr-8">
              <AlertTriangle className="h-5 w-5 drop-shadow-[0_0_8px_rgba(255,0,0,0.6)]" />
              <span className="font-['Space_Grotesk'] font-bold tracking-widest uppercase">{unreadCount} Alerts</span>
            </div>

            <Link
              to="/profile"
              className="flex items-center justify-center p-3 rounded-xl bg-slate-900/50 border border-white/10 text-white/60 hover:text-[#00e5ff] hover:border-[#00e5ff]/40 hover:bg-[#00e5ff]/10 hover:shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </Link>

            <button
              onClick={() => triggerJarvisAlarm("JARVIS audio system online. Critical simulation in progress.")}
              className="flex items-center justify-center p-3 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:bg-[#00e5ff]/20 hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all"
              title="Test Looping JARVIS Audio System"
            >
              <Volume2 className="h-5 w-5" />
            </button>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center justify-center p-3 rounded-xl bg-slate-900/50 border border-white/10 text-white/60 hover:text-[#00e5ff] hover:border-[#00e5ff]/40 hover:bg-[#00e5ff]/10 hover:shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 text-sm font-['Space_Grotesk'] tracking-widest uppercase text-white/50 hover:text-[#00e5ff] transition-colors ml-4"
            >
              <LogOut className="h-5 w-5" />
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