const { detectTraffic } = require("./aiService");

const runSimulation = (io) => {
  setInterval(async () => {
    try {
      const data = await detectTraffic();

      io.emit("traffic:update", data);

      if (data.density > 90) {
        io.emit("alert:new", {
          severity: "critical",
          message: "Traffic congestion critical"
        });
      }
    } catch (error) {
      console.log("AI service not running, using fallback simulation");

      const data = {
        vehicles: Math.floor(Math.random() * 100) + 20,
        density: Math.floor(Math.random() * 100) + 1
      };

      io.emit("traffic:update", data);

      if (data.density >= 100) {
        const simulatedAlert = {
          severity: "critical",
          title: "100% Simulated Lane Congestion",
          description: "Simulated traffic density has reached 100% critical limit.",
          created_at: new Date().toISOString(),
          is_read: false,
          id: Date.now() + Math.floor(Math.random() * 1000)
        };
        global.alertsMemory = global.alertsMemory || [];
        global.alertsMemory.unshift(simulatedAlert);
        
        io.emit("alert:new", [simulatedAlert]);
      } else if (data.density > 90) {
        io.emit("alert:new", {
          severity: "critical",
          message: "Traffic congestion critical"
        });
      }
    }
  }, 5000);
};

module.exports = { runSimulation };