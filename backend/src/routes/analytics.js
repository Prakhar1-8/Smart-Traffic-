const router = require("express").Router();
const { pool } = require("../db");
const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

let cachedInsights = null;
let lastAnalysisTime = null;

async function generateGeminiInsights(latest) {
  if (!genAI) throw new Error("GEMINI_API_KEY is not set");
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an intelligent traffic management AI. Analyze the following traffic data:
Total Vehicles: ${latest.totalVehicles}
Density: ${latest.density}%
Recommended Signal Time: ${latest.recommendedSignalTime}s
Vehicle Types: ${JSON.stringify(latest.vehicleTypes)}
Lane Density: ${JSON.stringify(latest.laneDensity)}
Traffic Trend: ${JSON.stringify(latest.trafficTrend)}

Return ONLY a valid JSON array of insightful observations or warnings for the Traffic Dashboard.
Provide exactly 5-6 short, actionable observation strings. Structure must be:
[
  { "id": 1, "insight": "Start with priority insights (critical congestion, long waits, etc.)" },
  { "id": 2, "insight": "Another short insight." }
]
Do not wrap it in markdown.`;

  const result = await model.generateContent(prompt);
  let responseText = result.response.text();
  responseText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();

  return JSON.parse(responseText);
}

const getLatestAnalysis = async (tenantId) => {
  try {
    const { rows } = await pool.query("SELECT latest_analysis FROM system_cache WHERE tenant_id = $1", [tenantId]);
    if (rows && rows.length > 0) {
      return rows[0].latest_analysis || {};
    }
  } catch (err) {
    console.warn("Analytics offline mode triggered");
  }
  return global.latestVideoResult || {};
};

router.get("/vehicle-types", async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || 1;
    const latest = await getLatestAnalysis(tenantId);
    res.json({ success: true, data: latest.vehicleTypes || { car: 0, bike: 0, bus: 0, truck: 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database failure" });
  }
});

router.get("/hourly-count", async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || 1;
    const latest = await getLatestAnalysis(tenantId);
    res.json({ success: true, data: latest.trafficTrend || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database failure" });
  }
});

router.get("/lane-density", async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || 1;
    const latest = await getLatestAnalysis(tenantId);
    res.json({ success: true, data: latest.laneDensity || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database failure" });
  }
});

router.get("/insights", async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || 1;
    const latest = await getLatestAnalysis(tenantId);
    const currentAnalysisTime = latest.updatedAt || "N/A";

  const fallbackLogic = () => {
    const laneDensity = [...(latest.laneDensity || [])];
    const trafficTrend = [...(latest.trafficTrend || [])];
    const insights = [];

    const highestLane = laneDensity.length
      ? laneDensity.sort((a, b) => b.density - a.density)[0]
      : null;

    const peakTrend = trafficTrend.length
      ? trafficTrend.reduce((max, item) => (item.vehicles > max.vehicles ? item : max))
      : null;

    const lowestTrend = trafficTrend.length
      ? trafficTrend.reduce((min, item) => (item.vehicles < min.vehicles ? item : min))
      : null;

    if (latest.density >= 90) {
      insights.push({ id: 1, insight: "Critical congestion detected. Immediate signal optimization is recommended." });
    } else if (latest.density >= 75) {
      insights.push({ id: 1, insight: "High congestion detected. Extended green signal timing is recommended." });
    } else if (latest.density >= 50) {
      insights.push({ id: 1, insight: "Moderate congestion detected. Traffic flow should be monitored closely." });
    } else {
      insights.push({ id: 1, insight: "Traffic is stable. Current signal timing is sufficient." });
    }

    if (highestLane) {
      insights.push({ id: 2, insight: `${highestLane.lane} shows the highest congestion at ${highestLane.density}%.` });
    }
    if (peakTrend) {
      insights.push({ id: 3, insight: `Peak traffic was observed at ${peakTrend.time} with ${peakTrend.vehicles} detected vehicles.` });
    }
    if (lowestTrend) {
      insights.push({ id: 4, insight: `Lowest traffic was observed at ${lowestTrend.time} with ${lowestTrend.vehicles} detected vehicles.` });
    }

    if (trafficTrend.length >= 2) {
      const first = trafficTrend[0].vehicles;
      const last = trafficTrend[trafficTrend.length - 1].vehicles;
      if (last > first) {
        insights.push({ id: 5, insight: "Traffic volume increased toward the end of the observation window." });
      } else if (last < first) {
        insights.push({ id: 5, insight: "Traffic volume reduced toward the end of the observation window." });
      } else {
        insights.push({ id: 5, insight: "Traffic remained relatively stable across the observation window." });
      }
    }

    insights.push({ id: 6, insight: `Recommended green timing is ${latest.recommendedSignalTime || 30} seconds.` });
    return insights;
  };

    try {
      if (currentAnalysisTime !== "N/A" && currentAnalysisTime !== lastAnalysisTime) {
        cachedInsights = await generateGeminiInsights(latest);
        lastAnalysisTime = currentAnalysisTime;
      } else if (!cachedInsights) {
        cachedInsights = fallbackLogic();
      }
    } catch (error) {
      console.error("Gemini Insight Generation failed, using static fallback:", error.message);
      cachedInsights = fallbackLogic();
    }

    res.json({
      success: true,
      data: cachedInsights,
    });
  } catch (err) {
    console.error("Insights Fetch Error:", err);
    res.status(500).json({ success: false, message: "Database failure" });
  }
});

module.exports = router;