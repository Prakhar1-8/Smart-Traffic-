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

      if (data.density > 90) {
        io.emit("alert:new", {
          severity: "critical",
          message: "Traffic congestion critical"
        });
      }
    }
  }, 5000);
};

module.exports = { runSimulation };