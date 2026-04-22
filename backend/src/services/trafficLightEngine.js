const { pool } = require("../db");

const W_COUNT = 1.0;
const W_QUEUE = 2.0;
const W_WAIT = 1.5;
const YELLOW_DURATION = 3000;

let engineInterval = null;
let currentGreenLane = "l1"; // Default start
let isTransitioning = false;
let emergencyTargetLane = null;

let localSignalState = {
  mode: "auto",
  manualOverride: false,
  currentGreenTime: 30,
  recommendedGreenTime: 30,
  directions: { l1: "green", l2: "red", l3: "red", l4: "red" }
};

let laneData = {
  l1: { waiting_time: 0 },
  l2: { waiting_time: 0 },
  l3: { waiting_time: 0 },
  l4: { waiting_time: 0 }
};

function broadcastState(io) {
  if (io) io.emit("signal:update", localSignalState);
}

function triggerEmergencyOverride(laneId) {
  if (!["l1", "l2", "l3", "l4"].includes(laneId)) return false;
  emergencyTargetLane = laneId;
  return true;
}

function clearEmergencyOverride() {
  emergencyTargetLane = null;
}

async function syncLocalWithDB(tenantId = 1) {
  try {
    const { rows } = await pool.query("SELECT * FROM signals WHERE tenant_id = $1 AND junction_id = 101", [tenantId]);
    if (rows.length > 0) {
      localSignalState.mode = rows[0].mode;
      localSignalState.manualOverride = rows[0].manual_override;
      if (localSignalState.mode === "manual") {
          localSignalState.currentGreenTime = rows[0].current_green_time;
      }
      localSignalState.recommendedGreenTime = rows[0].recommended_green_time;
    }
  } catch (err) {
    console.error("Traffic Engine sync Error:", err);
  }
}

function updateLaneDataFromGlobalData() {
  const latest = global.latestVideoResult;
  let simulatedCounts = { l1: 10, l2: 5, l3: 15, l4: 8 };
  let simulatedQueue = { l1: 2, l2: 1, l3: 5, l4: 0 };

  if (latest && latest.laneDensity && latest.laneDensity.length > 0) {
    // Map laneDensity to l1, l2, l3, l4 approximately based on array elements or names
    const mapping = ["l1", "l2", "l3", "l4"];
    latest.laneDensity.forEach((ld, idx) => {
        let lId = mapping[idx] || "l1";
        if (ld.lane.toLowerCase().includes("1") || ld.lane.toLowerCase() === "lane 1") lId = "l1";
        else if (ld.lane.toLowerCase().includes("2") || ld.lane.toLowerCase() === "lane 2") lId = "l2";
        else if (ld.lane.toLowerCase().includes("3") || ld.lane.toLowerCase() === "lane 3") lId = "l3";
        else if (ld.lane.toLowerCase().includes("4") || ld.lane.toLowerCase() === "lane 4") lId = "l4";
        
        simulatedCounts[lId] = Math.round(ld.density * 1.5); 
        simulatedQueue[lId] = Math.round(ld.density * 0.3);
    });
  } else {
    // Simulate dynamic fluctuations if no data
    ["l1", "l2", "l3", "l4"].forEach(l => {
       simulatedCounts[l] = Math.floor(Math.random() * 20);
       simulatedQueue[l] = Math.floor(Math.random() * 5);
    });
  }

  return { counts: simulatedCounts, queue: simulatedQueue };
}

function calculatePriority(laneId, dataCounts, dataQueue) {
  const lane = laneData[laneId];
  return (dataCounts[laneId] * W_COUNT) + 
         (dataQueue[laneId] * W_QUEUE) + 
         (lane.waiting_time * W_WAIT);
}

function startTrafficEngine(io) {
  if (engineInterval) return; 

  const evaluationIntervalMs = 5000;

  const tickEngine = async () => {
    if (isTransitioning) return;

    await syncLocalWithDB();

    if (localSignalState.mode === "manual") {
      engineInterval = setTimeout(tickEngine, 2000);
      return;
    }

    // Increment waiting time for RED lanes
    ["l1", "l2", "l3", "l4"].forEach(laneId => {
      if (localSignalState.directions[laneId] === "red") {
        laneData[laneId].waiting_time += (evaluationIntervalMs / 1000);
      }
    });

    let bestLane = currentGreenLane;

    if (emergencyTargetLane) {
      bestLane = emergencyTargetLane;
    } else {
      const { counts, queue } = updateLaneDataFromGlobalData();
      let highestScore = -1;

      ["l1", "l2", "l3", "l4"].forEach(laneId => {
        const score = calculatePriority(laneId, counts, queue);
        if (score > highestScore) {
          highestScore = score;
          bestLane = laneId;
        }
      });
    }

    if (bestLane !== currentGreenLane) {
      isTransitioning = true;
      
      // 1. Current to Yellow
      localSignalState.directions[currentGreenLane] = "yellow";
      broadcastState(io);

      setTimeout(() => {
        // 2. Safely Clear
        localSignalState.directions[currentGreenLane] = "red";
        laneData[currentGreenLane].waiting_time = 0;

        // 3. New Lane Green
        currentGreenLane = bestLane;
        localSignalState.directions[currentGreenLane] = "green";
        laneData[currentGreenLane].waiting_time = 0;
        
        broadcastState(io);
        
        isTransitioning = false;

        // Keep loop alive
        engineInterval = setTimeout(tickEngine, evaluationIntervalMs);
      }, YELLOW_DURATION);

    } else {
      // Stay Green, Loop Evaluates Again
      engineInterval = setTimeout(tickEngine, evaluationIntervalMs);
    }
  };

  tickEngine();
}

module.exports = {
  startTrafficEngine,
  triggerEmergencyOverride,
  clearEmergencyOverride
};
