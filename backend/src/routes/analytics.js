const router = require("express").Router();
const trafficStore = require("../store/trafficStore");

router.get("/vehicle-types", (req, res) => {
  res.json({
    success: true,
    data: trafficStore.latestAnalysis.vehicleTypes,
  });
});

router.get("/hourly-count", (req, res) => {
  res.json({
    success: true,
    data: trafficStore.latestAnalysis.trafficTrend || [],
  });
});

router.get("/lane-density", (req, res) => {
  res.json({
    success: true,
    data: trafficStore.latestAnalysis.laneDensity || [],
  });
});

router.get("/insights", (req, res) => {
  const latest = trafficStore.latestAnalysis;
  const laneDensity = [...(latest.laneDensity || [])];
  const trafficTrend = [...(latest.trafficTrend || [])];

  const insights = [];

  const highestLane = laneDensity.length
    ? laneDensity.sort((a, b) => b.density - a.density)[0]
    : null;

  const peakTrend = trafficTrend.length
    ? trafficTrend.reduce((max, item) =>
        item.vehicles > max.vehicles ? item : max
      )
    : null;

  const lowestTrend = trafficTrend.length
    ? trafficTrend.reduce((min, item) =>
        item.vehicles < min.vehicles ? item : min
      )
    : null;

  if (latest.density >= 90) {
    insights.push({
      id: 1,
      insight:
        "Critical congestion detected. Immediate signal optimization is recommended.",
    });
  } else if (latest.density >= 75) {
    insights.push({
      id: 1,
      insight:
        "High congestion detected. Extended green signal timing is recommended.",
    });
  } else if (latest.density >= 50) {
    insights.push({
      id: 1,
      insight:
        "Moderate congestion detected. Traffic flow should be monitored closely.",
    });
  } else {
    insights.push({
      id: 1,
      insight: "Traffic is stable. Current signal timing is sufficient.",
    });
  }

  if (highestLane) {
    insights.push({
      id: 2,
      insight: `${highestLane.lane} shows the highest congestion at ${highestLane.density}%.`,
    });
  }

  if (peakTrend) {
    insights.push({
      id: 3,
      insight: `Peak traffic was observed at ${peakTrend.time} with ${peakTrend.vehicles} detected vehicles.`,
    });
  }

  if (lowestTrend) {
    insights.push({
      id: 4,
      insight: `Lowest traffic was observed at ${lowestTrend.time} with ${lowestTrend.vehicles} detected vehicles.`,
    });
  }

  if (trafficTrend.length >= 2) {
    const first = trafficTrend[0].vehicles;
    const last = trafficTrend[trafficTrend.length - 1].vehicles;

    if (last > first) {
      insights.push({
        id: 5,
        insight:
          "Traffic volume increased toward the end of the observation window.",
      });
    } else if (last < first) {
      insights.push({
        id: 5,
        insight:
          "Traffic volume reduced toward the end of the observation window.",
      });
    } else {
      insights.push({
        id: 5,
        insight:
          "Traffic remained relatively stable across the observation window.",
      });
    }
  }

  insights.push({
    id: 6,
    insight: `Recommended green timing is ${latest.recommendedSignalTime || 30} seconds.`,
  });

  res.json({
    success: true,
    data: insights,
  });
});

module.exports = router;