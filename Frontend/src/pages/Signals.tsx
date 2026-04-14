import { useEffect, useMemo, useState } from "react";
import { getSignals, updateSignalMode, updateSignalTiming, updateSignal } from "../lib/api";

type Direction = "north" | "south" | "east" | "west";
type LightColor = "red" | "yellow" | "green";
type SignalMode = "auto" | "manual";

interface SignalState {
  mode: SignalMode;
  currentGreenTime: number;
  recommendedGreenTime: number;
  manualOverride: boolean;
  junctionId: number;
  directions: Record<Direction, LightColor>;
}

const initialSignalState: SignalState = {
  mode: "auto",
  currentGreenTime: 30,
  recommendedGreenTime: 30,
  manualOverride: false,
  junctionId: 1,
  directions: {
    north: "red",
    south: "red",
    east: "red",
    west: "red",
  },
};

export default function Signals() {
  const [signalState, setSignalState] = useState<SignalState>(initialSignalState);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [manualTime, setManualTime] = useState<number>(30);

  const loadSignals = async () => {
    try {
      const res = await getSignals(1);
      const data = res.data.data || res.data;

      setSignalState(data);
      setManualTime(data.currentGreenTime ?? 30);
    } catch (err) {
      console.error("Signals fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSignals();

    const interval = setInterval(() => {
      loadSignals();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleModeChange = async (mode: SignalMode) => {
    try {
      setActionLoading(`mode-${mode}`);
      const res = await updateSignalMode(1, mode);
      const data = res.data.data || res.data;
      setSignalState(data);
      setManualTime(data.currentGreenTime ?? 30);
    } catch (err) {
      console.error("Signal mode update error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTimingUpdate = async () => {
    try {
      setActionLoading("timing");
      const res = await updateSignalTiming(1, Number(manualTime));
      const data = res.data.data || res.data;
      setSignalState(data);
    } catch (err) {
      console.error("Signal timing update error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDirectionChange = async (direction: Direction, color: LightColor) => {
    try {
      setActionLoading(`${direction}-${color}`);
      const res = await updateSignal(1, direction, color);
      const data = res.data.data || res.data;
      setSignalState(data);
    } catch (err) {
      console.error("Signal update error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const statusText = useMemo(() => {
    if (signalState.mode === "auto") {
      return "System is using AI-recommended signal timing.";
    }
    return "Manual override is active. Operator controls are enabled.";
  }, [signalState.mode]);

  const renderSignal = (direction: Direction) => {
    const active = signalState.directions[direction];

    return (
      <div className="p-4 rounded-xl border border-white/10 bg-black/30">
        <h3 className="text-lg font-semibold capitalize mb-4">{direction}</h3>

        <div className="flex gap-3 mb-4 flex-wrap">
          {(["red", "yellow", "green"] as LightColor[]).map((color) => (
            <button
              key={color}
              onClick={() => handleDirectionChange(direction, color)}
              disabled={signalState.mode !== "manual" || actionLoading !== null}
              className={`px-4 py-2 rounded-lg border capitalize disabled:opacity-50 ${
                active === color
                  ? "border-cyan-400 bg-cyan-500/20"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {color}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-300">
          Current State:{" "}
          <span className="font-semibold capitalize">{active}</span>
        </p>
      </div>
    );
  };

  if (loading) {
    return <div className="p-6 text-white">Loading signals...</div>;
  }

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Traffic Signals</h1>
        <p className="text-sm text-white/60 mt-1">{statusText}</p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-white/70">Signal Mode</p>
          <h2 className="text-3xl font-bold mt-2 uppercase">{signalState.mode}</h2>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-white/70">Current Green Time</p>
          <h2 className="text-3xl font-bold mt-2">{signalState.currentGreenTime}s</h2>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-white/70">Recommended Green Time</p>
          <h2 className="text-3xl font-bold mt-2">
            {signalState.recommendedGreenTime}s
          </h2>
        </div>
      </div>

      {/* MODE CONTROL */}
      <div className="rounded-xl border border-white/10 bg-black/30 p-5 space-y-4">
        <h2 className="text-xl font-semibold">Signal Control Mode</h2>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => handleModeChange("auto")}
            disabled={actionLoading !== null}
            className={`px-4 py-2 rounded-lg border disabled:opacity-50 ${
              signalState.mode === "auto"
                ? "border-cyan-400 bg-cyan-500/20"
                : "border-white/10 bg-white/5"
            }`}
          >
            {actionLoading === "mode-auto" ? "Switching..." : "Auto Mode"}
          </button>

          <button
            onClick={() => handleModeChange("manual")}
            disabled={actionLoading !== null}
            className={`px-4 py-2 rounded-lg border disabled:opacity-50 ${
              signalState.mode === "manual"
                ? "border-cyan-400 bg-cyan-500/20"
                : "border-white/10 bg-white/5"
            }`}
          >
            {actionLoading === "mode-manual" ? "Switching..." : "Manual Mode"}
          </button>
        </div>
      </div>

      {/* MANUAL TIMING */}
      <div className="rounded-xl border border-white/10 bg-black/30 p-5 space-y-4">
        <h2 className="text-xl font-semibold">Manual Timing Override</h2>

        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <input
            type="number"
            min={10}
            max={120}
            value={manualTime}
            onChange={(e) => setManualTime(Number(e.target.value))}
            disabled={signalState.mode !== "manual" || actionLoading !== null}
            className="w-full md:w-60 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none disabled:opacity-50"
          />

          <button
            onClick={handleTimingUpdate}
            disabled={signalState.mode !== "manual" || actionLoading !== null}
            className="px-4 py-2 rounded-lg border border-cyan-400 bg-cyan-500/20 disabled:opacity-50"
          >
            {actionLoading === "timing" ? "Updating..." : "Apply Green Time"}
          </button>
        </div>

        <p className="text-sm text-white/60">
          Manual timing can be set between 10 and 120 seconds.
        </p>
      </div>

      {/* DIRECTION CONTROLS */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Direction Control</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderSignal("north")}
          {renderSignal("south")}
          {renderSignal("east")}
          {renderSignal("west")}
        </div>
      </div>
    </div>
  );
}