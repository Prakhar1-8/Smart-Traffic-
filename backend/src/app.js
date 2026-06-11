require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { router: videoRouter, setIO } = require("./routes/video");
const { initDB } = require("./db");
const { startTrafficEngine } = require("./services/trafficLightEngine");
const app = express();
const server = http.createServer(app);
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",") 
  : ["http://localhost:8080", "http://localhost:5173", "http://localhost:5000"];

const io = new Server(server, {
  cors: { 
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT"]
  }
});

app.set("io", io);
setIO(io);

app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 60000, max: 500 }));

app.use("/uploads", express.static(path.join(__dirname, "../../uploads"))); 
app.use("/processed", express.static(path.join(__dirname, "../../processed_videos")));

app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/signals", require("./routes/signals"));
app.use("/api/alerts", require("./routes/alerts"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/cameras", require("./routes/cameras"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/video", videoRouter);
app.use("/api/reports", require("./routes/reports"));
app.use("/api/health", require("./routes/health"));

io.on("connection", () => console.log("Client connected"));

if (require.main === module) {
  server.listen(5000, async () => {
    await initDB();
    console.log("Server running on 5000");
    startTrafficEngine(io);
  });
}

module.exports = { app, server };