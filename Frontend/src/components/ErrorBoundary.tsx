import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error strictly intercepted:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center p-6 bg-background rounded-2xl border border-destructive/20 relative overflow-hidden">
           <div className="absolute inset-0 bg-destructive/5 pulse-slow" />
           <div className="relative z-10 max-w-md text-center space-y-4 glow-card p-8 rounded-xl border border-destructive/30 bg-black/60 backdrop-blur-xl shadow-[0_0_50px_rgba(255,0,0,0.15)] animate-in slide-in-from-bottom-6">
              <div className="mx-auto w-16 h-16 bg-destructive/20 flex items-center justify-center rounded-full border border-destructive/50 mb-6 drop-shadow-md">
                 <AlertTriangle className="text-destructive w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-2xl font-display font-bold uppercase tracking-widest text-destructive glow-text">System Overload</h2>
              <p className="text-sm text-muted-foreground font-mono">
                A critical rendering phase failed natively. Safe-mode engaged.
              </p>
              <div className="bg-black/50 p-3 rounded text-xs font-mono text-destructive/80 text-left border border-destructive/20 overflow-x-auto">
                 {this.state.errorMsg || "Reference exception out of bounds."}
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors text-white"
              >
                <RefreshCw className="w-4 h-4" />
                Flush RAM & Restart Matrix
              </button>
           </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
