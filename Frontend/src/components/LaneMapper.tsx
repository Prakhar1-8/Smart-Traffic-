import React, { useState, useRef } from 'react';
import { updateCameraConfig } from '../lib/api';

type Point = { x: number; y: number };
type LanePolygon = { id: string; name: string; points: Point[] };

export default function LaneMapper({ cameraId, cameraUrl }: { cameraId: number, cameraUrl: string }) {
  const [lanes, setLanes] = useState<LanePolygon[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{text: string, type: 'success'|'error'} | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentPoints.length === 3) {
      // Finish polygon on 4th click
      setLanes([...lanes, { id: `lane-${Date.now()}`, name: `Lane ${lanes.length + 1}`, points: [...currentPoints, { x, y }] }]);
      setCurrentPoints([]);
      setIsDrawing(false);
    } else {
      setCurrentPoints([...currentPoints, { x, y }]);
    }
  };

  const saveConfig = async () => {
    try {
      const formattedConfig = lanes.map(l => ({
        lane: l.name,
        poly: l.points.map(p => [p.x, p.y])
      }));
      
      const response = await updateCameraConfig(cameraId, formattedConfig);
      
      if (response && response.success) {
         setStatusMsg({ text: 'Lane configuration strictly mapped to PostgreSQL matrix.', type: 'success' });
      } else {
         setStatusMsg({ text: 'Neural API connection rejected the vector payload.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setStatusMsg({ text: 'Error committing configuration - Connection severed.', type: 'error' });
    }
    
    setTimeout(() => setStatusMsg(null), 4000);
  };

  return (
    <div className="glass-card p-6 border-white/5 space-y-6 relative">
      <div>
        <h2 className="text-xl font-display font-bold text-white/90">Dynamic Sector Configuration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Draw precisely 4 points perfectly around the bounds of each vector lane on the RTSP feed to recalibrate spatial matrices.
        </p>
      </div>

      <div className="relative w-full aspect-video bg-black border border-white/10 rounded-xl overflow-hidden group shadow-[inset_0_0_50px_rgba(0,0,0,0.9)]">
        {/* Simulated Video Feed background to prove UI works realistically */}
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1510260271378-c51f98501e74?q=80&w=1280')] bg-cover bg-center grayscale mix-blend-screen pulse-slow" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/80 px-4 py-2 rounded-md border border-white/5 backdrop-blur-md">
            <span className="text-xs text-primary font-mono select-none tracking-widest">{cameraUrl} • LIVE</span>
          </div>
        </div>
        
        <svg 
          ref={svgRef}
          onClick={handleSvgClick}
          className={`absolute inset-0 w-full h-full z-10 ${isDrawing ? 'cursor-crosshair' : 'cursor-default'}`}
        >
          {lanes.map((lane, i) => (
             <polygon
               key={i}
               points={lane.points.map(p => `${p.x},${p.y}`).join(' ')}
               fill="hsla(var(--primary) / 0.2)"
               stroke="hsl(var(--primary))"
               strokeWidth="2"
               strokeDasharray="4"
             />
          ))}
          
          {currentPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={4} fill="white" />
          ))}

          {currentPoints.length > 0 && (
            <polyline
               points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')}
               fill="none"
               stroke="white"
               strokeWidth="2"
               strokeDasharray="4"
            />
          )}

          {/* Mouse tracking line could go here */}
        </svg>

        {isDrawing && (
          <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg text-primary text-xs font-bold uppercase tracking-widest border border-primary/30 animate-pulse">
            Drawing Mode: Click point {currentPoints.length + 1}/4
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button 
           onClick={() => setIsDrawing(true)}
           disabled={isDrawing}
           className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
        >
          Calibrate New Lane
        </button>
        <button 
           onClick={() => setLanes([])}
           className="bg-destructive/20 hover:bg-destructive/40 text-destructive border border-destructive/30 px-6 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          Clear Memory
        </button>
        <button 
           onClick={saveConfig}
           className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 px-8 py-2 rounded-lg text-sm font-bold transition-all ml-auto shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
        >
          Commit Vector Matrix
        </button>
      </div>

      {statusMsg && (
        <div className={`absolute top-4 right-4 px-6 py-3 rounded-lg text-sm font-bold tracking-wide border backdrop-blur-xl animate-in slide-in-from-top-4 fade-in ${statusMsg.type === 'success' ? 'bg-primary/10 text-primary border-primary/40' : 'bg-destructive/10 text-destructive border-destructive/40'}`}>
           {statusMsg.text}
        </div>
      )}
    </div>
  );
}
