import { useState } from "react";
import AnimatedCard from "@/components/AnimatedCard";
import { Camera, Brain, Bell, Cog } from "lucide-react";

function Toggle({ value, onChange, disabled = false }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"} ${disabled ? "opacity-30" : ""}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-foreground transition-transform ${value ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

function Select({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-background-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function SettingsPage() {
  const [nightVision, setNightVision] = useState(true);
  const [autoLearn, setAutoLearn] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [confidence, setConfidence] = useState(85);
  const [notifs, setNotifs] = useState({ critical: true, warning: true, info: false, email: true });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AnimatedCard index={0}>
        <div className="flex items-center gap-2 mb-4">
          <Camera className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Camera Configuration</h3>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Active Cameras</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground">24/24</span>
              <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">All Online</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Frame Rate</span>
            <Select options={["30 FPS", "60 FPS", "120 FPS"]} value="30 FPS" onChange={() => {}} />
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Resolution</span>
            <Select options={["1080p", "4K"]} value="1080p" onChange={() => {}} />
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Night Vision</span>
            <Toggle value={nightVision} onChange={setNightVision} />
          </div>
        </div>
      </AnimatedCard>

      <AnimatedCard index={1}>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-medium text-foreground">AI Model Settings</h3>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Model Version</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground">v2.4.1</span>
              <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">Latest</span>
            </div>
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Detection Confidence</span>
              <span className="text-foreground">{confidence}%</span>
            </div>
            <input type="range" min={50} max={99} value={confidence} onChange={(e) => setConfidence(+e.target.value)} className="w-full accent-primary" />
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Optimization Mode</span>
            <Select options={["Balanced", "Performance", "Accuracy"]} value="Balanced" onChange={() => {}} />
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Auto-learn</span>
            <Toggle value={autoLearn} onChange={setAutoLearn} />
          </div>
        </div>
      </AnimatedCard>

      <AnimatedCard index={2}>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-warning" />
          <h3 className="text-sm font-medium text-foreground">Notification Preferences</h3>
        </div>
        <div className="space-y-4">
          {[
            { label: "Critical Alerts", desc: "High-priority system alerts", key: "critical" as const },
            { label: "Warning Alerts", desc: "Moderate priority warnings", key: "warning" as const },
            { label: "Info Alerts", desc: "General information updates", key: "info" as const },
            { label: "Email Notifications", desc: "Send alerts via email", key: "email" as const },
          ].map((item) => (
            <div key={item.key} className="flex justify-between items-center">
              <div>
                <p className="text-sm text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Toggle value={notifs[item.key]} onChange={(v) => setNotifs((n) => ({ ...n, [item.key]: v }))} />
            </div>
          ))}
        </div>
      </AnimatedCard>

      <AnimatedCard index={3}>
        <div className="flex items-center gap-2 mb-4">
          <Cog className="h-5 w-5 text-destructive" />
          <h3 className="text-sm font-medium text-foreground">System Preferences</h3>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Data Retention</span>
            <Select options={["7 days", "30 days", "90 days"]} value="30 days" onChange={() => {}} />
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Auto-backup</span>
            <Select options={["Daily", "Weekly", "Monthly"]} value="Daily" onChange={() => {}} />
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Dark Mode</span>
            <Toggle value={darkMode} onChange={setDarkMode} />
          </div>
          <button className="w-full mt-2 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm hover:opacity-90 transition-opacity">
            Save All Changes
          </button>
        </div>
      </AnimatedCard>
    </div>
  );
}
