import { Link } from "react-router-dom";
import { useEffect } from "react";

export default function LandingPage() {
  // Ensure the material symbols font is loaded since the design requires it
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    
    const fontLink = document.createElement("link");
    fontLink.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);
    
    return () => {
      // Optional cleanup
    };
  }, []);

  return (
    <div className="antialiased text-[#dce1fb] text-[14px] leading-[1.5] overflow-x-hidden font-sans min-h-screen flex flex-col" style={{
        backgroundColor: "#0c1324",
        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(0, 218, 243, 0.05) 0%, transparent 50%),
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
        backgroundSize: "100% 100%, 40px 40px, 40px 40px"
    }}>
      <style>{`
        .perspective-view {
            perspective: 1200px;
        }
        .tilt-card {
            transform: rotateX(10deg) rotateY(-5deg);
            transform-style: preserve-3d;
        }
        .hud-scanline {
            background: linear-gradient(to bottom, transparent 50%, rgba(0, 218, 243, 0.05) 50%);
            background-size: 100% 4px;
        }
      `}</style>
      
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 rounded-none bg-slate-950/60 backdrop-blur-[20px] border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex justify-between items-center px-10 py-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>traffic</span>
          <span className="text-xl font-bold tracking-tighter text-cyan-400 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)] font-['Space_Grotesk']">Smart Adaptive Traffic Management</span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-['Space_Grotesk'] tracking-tight text-sm uppercase font-medium">
          <a className="text-cyan-400 font-bold border-b-2 border-cyan-400 pb-1" href="/">Home</a>
          <a className="text-slate-400 hover:text-cyan-300 transition-colors" href="#">Contact</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <button className="px-5 py-2 text-slate-400 hover:text-cyan-300 transition-colors font-['Space_Grotesk'] text-sm uppercase font-medium">Login</button>
          </Link>
          <Link to="/signup">
            <button className="px-6 py-2 bg-cyan-500/10 border border-cyan-400/50 text-cyan-400 font-bold tracking-tight text-sm uppercase rounded-sm hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all active:scale-95 duration-200 ease-out">Sign Up</button>
          </Link>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="relative pt-32 pb-20 px-6 max-w-screen-2xl mx-auto flex flex-col items-center min-h-screen">
        {/* JARVIS Badge */}
        <div className="mb-8 flex items-center gap-3 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 backdrop-blur-md shadow-[0_0_15px_rgba(0,218,243,0.1)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-[12px] leading-none uppercase tracking-[0.15em] font-bold font-['Space_Grotesk'] text-cyan-400">JARVIS Traffic Engine Online</span>
        </div>

        {/* Hero Heading */}
        <div className="text-center max-w-4xl z-10">
          <h1 className="text-[48px] md:text-[64px] leading-[1.1] tracking-[-0.04em] font-bold font-['Space_Grotesk'] text-white mb-6">
            Smart Adaptive <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#00e5ff]">Traffic Management</span>
          </h1>
          <p className="text-[16px] md:text-[18px] leading-[1.6] font-normal text-[#bac9cc] max-w-2xl mx-auto mb-10 opacity-80">
            AI-powered real-time vehicle detection and dynamic traffic signal optimization for smarter urban mobility. Engineered for the cities of tomorrow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <Link to="/login">
              <button className="w-full sm:w-auto px-10 py-4 bg-[#00e5ff] text-[#00626e] font-['Space_Grotesk'] text-[16px] font-bold rounded-sm shadow-[0_0_30px_rgba(0,229,255,0.3)] hover:brightness-110 active:scale-95 transition-all">
                  Login to Dashboard
              </button>
            </Link>
            <Link to="/signup">
              <button className="w-full sm:w-auto px-10 py-4 bg-slate-950/40 backdrop-blur-xl border border-cyan-500/30 text-cyan-400 font-['Space_Grotesk'] text-[16px] font-bold rounded-sm hover:bg-cyan-500/10 transition-all active:scale-95">
                  Sign Up
              </button>
            </Link>
          </div>
        </div>

        {/* 3D Cinematic Visualization */}
        <div className="relative w-full max-w-6xl mt-10 perspective-view">
          {/* Glass Overlay Card for HUD effect */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-cyan-500/20 bg-slate-950/30 backdrop-blur-[10px] tilt-card shadow-2xl">
            <img alt="Futuristic smart city intersection" className="w-full h-full object-cover mix-blend-screen opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVYnXh_y3B59nPHheO0VjjlmcnRD6_dTI0JqomcPetUQ5lzSn5XZDCT5hBsYGwn2mhxjkH-3kk36PBuYww_inhzq39ONwIVmmIXL1CDyOj_2hr-dIjBXB0ITXX24PPOgzDJiUM46p5trUqXgmRpw1yAJHugE8kS4f62ImV3IIJE6-1BoH71nuS8dgXhK3U1SO9AoBGDs9oQ7SmIL6vdEC7KWWRihKhdCRtnawK-2cFXel_zeeE0WFXpZggK7JO_4CKnLjh_jIQWgEn"/>
            {/* HUD Elements */}
            <div className="absolute inset-0 pointer-events-none p-[24px] flex flex-col justify-between hidden md:flex">
              <div className="flex justify-between items-start">
                <div className="bg-slate-950/80 border border-cyan-500/30 p-4 rounded backdrop-blur-md">
                  <p className="text-[10px] leading-none uppercase tracking-[0.15em] font-bold font-['Space_Grotesk'] text-cyan-500 mb-1">NODE_ID: SECTOR_7G</p>
                  <div className="flex items-end gap-2">
                    <span className="text-[32px] font-semibold leading-[1.2] tracking-[0.02em] font-['Space_Grotesk'] text-cyan-400">124</span>
                    <span className="text-[12px] leading-none uppercase tracking-[0.15em] font-bold font-['Space_Grotesk'] text-cyan-500/70 pb-1">Vehicles/Min</span>
                  </div>
                </div>
                <div className="bg-slate-950/80 border border-cyan-500/30 p-4 rounded backdrop-blur-md">
                  <p className="text-[10px] leading-none uppercase tracking-[0.15em] font-bold font-['Space_Grotesk'] text-[#00e5ff] mb-1">SIGNAL_OPTIMIZATION</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                    <span className="text-[24px] font-semibold leading-[1.3] tracking-[0.05em] font-['Space_Grotesk'] text-cyan-400">89% Efficiency</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mb-20">
                <div className="relative w-64 h-64 border-2 border-cyan-400/20 rounded-full flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-dashed border-cyan-400/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
                  <div className="w-48 h-48 border-2 border-cyan-400/40 rounded-full flex items-center justify-center">
                    <div className="w-32 h-32 bg-cyan-400/10 rounded-full flex items-center justify-center animate-pulse">
                      <span className="material-symbols-outlined text-4xl text-cyan-400">hub</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-[24px]">
                <div className="bg-slate-950/60 border border-cyan-500/10 p-3 rounded-sm backdrop-blur-sm">
                  <p className="text-[10px] leading-none uppercase tracking-[0.15em] font-bold font-['Space_Grotesk'] text-cyan-500/60">LANE_DENSITY</p>
                  <div className="w-full bg-slate-900 h-1 mt-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full w-3/4 shadow-[0_0_10px_rgba(0,218,243,0.8)]"></div>
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-cyan-500/10 p-3 rounded-sm backdrop-blur-sm">
                  <p className="text-[10px] leading-none uppercase tracking-[0.15em] font-bold font-['Space_Grotesk'] text-cyan-500/60">AI_CONFIDENCE</p>
                  <div className="w-full bg-slate-900 h-1 mt-2 rounded-full overflow-hidden">
                    <div className="bg-[#e9b3ff] h-full w-[94%] shadow-[0_0_10px_rgba(233,179,255,0.8)]"></div>
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-cyan-500/10 p-3 rounded-sm backdrop-blur-sm">
                  <p className="text-[10px] leading-none uppercase tracking-[0.15em] font-bold font-['Space_Grotesk'] text-cyan-500/60">LATENCY_MS</p>
                  <div className="w-full bg-slate-900 h-1 mt-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full w-1/5 shadow-[0_0_10px_rgba(0,218,243,0.8)]"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* HUD Scanlines */}
            <div className="absolute inset-0 pointer-events-none hud-scanline opacity-20"></div>
          </div>
          
          {/* Floating Decorative Rings */}
          <div className="absolute -top-10 -left-10 w-40 h-40 border border-cyan-500/20 rounded-full blur-xl opacity-30"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 border border-[#e9b3ff]/20 rounded-full blur-2xl opacity-20"></div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-slate-950/40 backdrop-blur-md border-t border-cyan-900/30 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 max-w-screen-2xl mx-auto gap-4">
          <span className="font-['Space_Grotesk'] text-[10px] tracking-widest uppercase text-cyan-500/50">
            © 2026 Smart Adaptive Traffic Management. All rights reserved.
          </span>
          <div className="flex gap-8 font-['Space_Grotesk'] text-[10px] tracking-widest uppercase">
            <a className="text-slate-600 hover:text-cyan-400 transition-colors opacity-80 hover:opacity-100" href="#">Privacy</a>
            <a className="text-slate-600 hover:text-cyan-400 transition-colors opacity-80 hover:opacity-100" href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
