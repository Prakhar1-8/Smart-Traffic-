const trafficStore = {
  latestAnalysis: {
    totalVehicles: 0,
    density: 0,
    alerts: 0,
    vehicleTypes: {
      car: 0,
      bike: 0,
      bus: 0,
      truck: 0,
    },
    laneDensity: [
      { lane: "Lane 1", density: 0 },
      { lane: "Lane 2", density: 0 },
      { lane: "Lane 3", density: 0 },
      { lane: "Lane 4", density: 0 },
    ],
    trafficTrend: [],
    recommendedSignalTime: 30,
    updatedAt: null,
    videoPath: null,
  },

  alerts: [],

  signalState: {
    mode: "auto",
    currentGreenTime: 30,
    recommendedGreenTime: 30,
    manualOverride: false,
    junctionId: 1,
    directions: {
      north: "red",
      south: "green",
      east: "red",
      west: "yellow",
    },
  },

  cameras: [
    {
      id: 1,
      junction_id: 1,
      camera_name: "Camera 1",
      stream_url: "",
      status: "online",
      last_active_at: new Date().toISOString(),
      processingStatus: "idle",
      hasVideo: true,
    },
    {
      id: 2,
      junction_id: 2,
      camera_name: "Camera 2",
      stream_url: "",
      status: "offline",
      last_active_at: new Date().toISOString(),
      processingStatus: "idle",
      hasVideo: false,
    },
    {
      id: 3,
      junction_id: 3,
      camera_name: "Camera 3",
      stream_url: "",
      status: "offline",
      last_active_at: new Date().toISOString(),
      processingStatus: "idle",
      hasVideo: false,
    },
  ],
};

module.exports = trafficStore;