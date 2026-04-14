from fastapi import FastAPI
from ultralytics import YOLO
import cv2
import os
import time
from collections import defaultdict

app = FastAPI()

# ---------------- VEHICLE CLASSES ----------------
VEHICLE_CLASSES = {
    2: "car",
    3: "bike",
    5: "bus",
    7: "truck",
}

# ---------------- COLORS ----------------
COLOR_MAP = {
    "car": (0, 255, 0),
    "bike": (0, 255, 255),
    "bus": (255, 0, 0),
    "truck": (0, 165, 255),
}

# ---------------- MODEL ----------------
model = YOLO("yolov8s.pt")

# ---------------- OUTPUT FOLDERS ----------------
OUTPUT_DIR = "processed_videos"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------------- HOME ----------------
@app.get("/")
def home():
    return {"message": "AI service running 🚀"}

# ---------------- PREPROCESS ----------------
def preprocess(frame):
    frame = cv2.resize(frame, (1280, 720))
    frame = cv2.convertScaleAbs(frame, alpha=1.2, beta=15)
    return frame

# ---------------- ANALYZE ----------------
@app.post("/analyze-video")
def analyze_video(payload: dict):

    video_path = payload.get("videoPath")

    if not video_path or not os.path.exists(video_path):
        return {"success": False, "message": "Video path not found"}

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        return {"success": False, "message": "Cannot open video"}

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 25

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # -------- OUTPUT VIDEO --------
    filename = f"processed_{int(time.time())}.mp4"
    output_path = os.path.join(OUTPUT_DIR, filename)

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    # -------- VARIABLES --------
    frame_skip = int(fps // 5)
    conf_thres = 0.15

    total = 0
    frames = 0
    max_frame = 0

    vehicle_counts = defaultdict(int)
    trend = []
    lane_counts = [0, 0, 0, 0]

    # -------- LOOP --------
    frame_id = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_id += 1

        if frame_id % frame_skip != 0:
            continue

        frame = preprocess(frame)
        frames += 1

        results = model(frame, conf=conf_thres, imgsz=1280, verbose=False)

        count_frame = 0
        boxes = []
        current_frame_counts = defaultdict(int)

        for r in results:
            if r.boxes is None:
                continue

            for box in r.boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])

                if cls in VEHICLE_CLASSES:
                    label = VEHICLE_CLASSES[cls]
                    count_frame += 1
                    vehicle_counts[label] += 1
                    current_frame_counts[label] += 1

                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    boxes.append((x1, y1, x2, y2, label, conf))

                    # lane
                    cx = (x1 + x2) / 2
                    lane = min(3, int(cx // (width / 4)))
                    lane_counts[lane] += 1

        total += count_frame
        max_frame = max(max_frame, count_frame)
        trend.append(count_frame)

        # -------- DRAW --------
        for (x1, y1, x2, y2, label, conf) in boxes:
            color = COLOR_MAP[label]

            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)

            text = f"{label.upper()} {conf:.2f}"
            (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)

            cv2.rectangle(frame, (int(x1), int(y1)-th-8), (int(x1)+tw, int(y1)), color, -1)

            cv2.putText(
                frame,
                text,
                (int(x1), int(y1)-4),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 0),
                2
            )

        # -------- COUNT OVERLAY --------
        overlay_text = f"C:{current_frame_counts['car']} B:{current_frame_counts['bike']} Bus:{current_frame_counts['bus']} T:{current_frame_counts['truck']}"
        cv2.putText(frame, overlay_text, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255,255,255), 2)

        out.write(frame)

    cap.release()
    out.release()

    if frames == 0:
        return {"success": False, "message": "No frames processed"}

    avg = total / frames

    # -------- DENSITY --------
    if avg <= 3:
        density = 20
    elif avg <= 6:
        density = 40
    elif avg <= 10:
        density = 60
    elif avg <= 15:
        density = 80
    else:
        density = 95

    # -------- SIGNAL --------
    if density >= 90:
        signal = 75
    elif density >= 75:
        signal = 60
    elif density >= 50:
        signal = 45
    else:
        signal = 30

    # -------- LANES --------
    max_lane = max(lane_counts) if max(lane_counts) > 0 else 1

    laneDensity = [
        {"lane": "Lane 1", "density": int(lane_counts[0]/max_lane*100)},
        {"lane": "Lane 2", "density": int(lane_counts[1]/max_lane*100)},
        {"lane": "Lane 3", "density": int(lane_counts[2]/max_lane*100)},
        {"lane": "Lane 4", "density": int(lane_counts[3]/max_lane*100)},
    ]

    # -------- TREND --------
    trend_data = [{"time": f"F{i+1}", "vehicles": v} for i,v in enumerate(trend[-10:])]

    while len(trend_data) < 10:
        trend_data.append({"time": f"F{len(trend_data)+1}", "vehicles": 0})

    return {
        "success": True,
        "totalVehicles": int(avg),
        "density": density,
        "vehicleTypes": {
            "car": int(vehicle_counts["car"] / frames) if frames > 0 else 0,
            "bike": int(vehicle_counts["bike"] / frames) if frames > 0 else 0,
            "bus": int(vehicle_counts["bus"] / frames) if frames > 0 else 0,
            "truck": int(vehicle_counts["truck"] / frames) if frames > 0 else 0,
        },
        "laneDensity": laneDensity,
        "trafficTrend": trend_data,
        "recommendedSignalTime": signal,
        "processedVideoPath": output_path,
        "meta": {
            "frames": frames,
            "avg": avg,
            "max": max_frame
        }
    }