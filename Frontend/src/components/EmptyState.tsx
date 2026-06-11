import { Link } from "react-router-dom";
import { Upload, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center animate-in fade-in duration-700">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full glass-card p-10 flex flex-col items-center space-y-6 border border-white/5 bg-background-secondary/30 relative overflow-hidden"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 shadow-2xl relative z-10">
          <Activity className="w-10 h-10 text-muted-foreground" />
        </div>
        
        <div className="space-y-2 relative z-10">
          <h2 className="text-2xl font-display font-bold tracking-tight text-white">No Traffic Data Available</h2>
          <p className="text-muted-foreground text-sm">Upload a video or connect a live feed to initialize the AI analysis engine.</p>
        </div>
        
        <Link to="/upload-video" className="w-full relative z-10">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-bold tracking-wide uppercase text-sm flex items-center justify-center gap-2 transition-colors glow-green shadow-[0_0_15px_rgba(34,211,238,0.2)]"
          >
            <Upload className="w-4 h-4" />
            Upload Traffic Video
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
