const request = require("supertest");
const express = require("express");

// Setup minimal app wrapper to test video router bounded logic independently
const { router } = require("../src/routes/video");
const app = express();
app.use(express.json());

// Mock user injection
app.use((req, res, next) => {
    req.user = { tenantId: 1 };
    next();
});
app.use("/api/video", router);

// Mock the PostgreSQL pool within the module graph
jest.mock("../src/db", () => {
    return {
        pool: {
            query: jest.fn().mockResolvedValue({ rows: [] })
        }
    };
});

describe("Video Processing Mechanics", () => {
  it("should block empty file constraints on upload", async () => {
    const res = await request(app).post("/api/video/upload");
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should fail gracefully when processing an explicit missing file constraint", async () => {
    const res = await request(app)
        .post("/api/video/process")
        .send({ fileName: "ghost_file_does_not_exist.mp4" });
    
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("should return a rigid 404 on invalid stream job query", async () => {
    const res = await request(app).get("/api/video/status/unknown-job");
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("should successfully log a webhook job completion constraint", async () => {
    // The webhook receives AI inference status updates
    const testJobId = "555-job-id";
    const res = await request(app)
        .post("/api/video/webhook")
        .send({
            job_id: testJobId,
            success: true,
            processedVideoPath: "test.webm",
            density: 50,
        });

    expect(res.statusCode).toBe(200);
    expect(res.body.received).toBe(true);
    
    // Test the in-memory persistence of jobTracking
    const statusRes = await request(app).get(`/api/video/status/${testJobId}`);
    expect(statusRes.statusCode).toBe(200);
    expect(statusRes.body.status).toBe("completed");
  });
});
