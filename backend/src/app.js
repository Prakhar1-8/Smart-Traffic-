require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { router: videoRouter, setIO } = require("./routes/video");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:8080" }
});

setIO(io);

app.use(cors({ origin: "http://localhost:8080" }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60000, max: 100 }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/signals", require("./routes/signals"));
app.use("/api/alerts", require("./routes/alerts"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/cameras", require("./routes/cameras"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/video", videoRouter);

io.on("connection", () => console.log("Client connected"));

server.listen(5000, () => console.log("Server running on 5000"));