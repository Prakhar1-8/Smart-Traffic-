from fastapi import FastAPI
from ultralytics import YOLO
import cv2
import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
import time
import requests
import numpy as np
import threading
from collections import defaultdict
import uuid
import traceback
import concurrent.futures

# Limit OpenCV threads to prevent VRAM explosion
executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)

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
# Model will be loaded per-request to ensure clean tracker state

# ---------------- PATHS ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "processed_videos")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------------- LANE POLYGONS ----------------
# Fallback if DB fetch fails
DEFAULT_LANE_POLYGONS = {
    "Lane 1": np.array([[0, 720], [300, 360], [450, 360], [320, 720]], np.int32),
    "Lane 2": np.array([[320, 720], [450, 360], [600, 360], [640, 720]], np.int32),
    "Lane 3": np.array([[640, 720], [600, 360], [750, 360], [960, 720]], np.int32),
    "Lane 4": np.array([[960, 720], [750, 360], [900, 360], [1280, 720]], np.int32),
}

# ---------------- LINE CROSSING ----------------
LINE_Y = 500


@app.get("/")
def home():
    return {"message": "AI service tracking & analytics running 🚀"}


@app.post("/analyze-video")
def analyze_video(payload: dict):
    job_id = str(uuid.uuid4())
    executor.submit(process_video_bg, payload, job_id)
    return {
        "success": True,
        "job_id": job_id,
        "message": "Asynchronous AI engine queued"
    }


def send_webhook(payload: dict):
    try:
        requests.post(
            "http://localhost:5000/api/video/webhook",
            json=payload,
            timeout=15,
        )
    except Exception as e:
        print(f"[WEBHOOK ERROR] {e}")


def send_live_update(data: dict):
    try:
        requests.post(
            "http://localhost:5000/api/video/live-update",
            json=data,
            timeout=1,
        )
    except Exception:
        pass


def get_density_value(avg_per_frame: float) -> int:
    if avg_per_frame <= 3:
        return 20
    if avg_per_frame <= 6:
        return 40
    if avg_per_frame <= 10:
        return 60
    if avg_per_frame <= 15:
        return 80
    return 95


def get_signal_time(v_count: float, q_length: float, starvation_cycles: int = 0) -> int:
    T_MIN = 10
    T_MAX = 75
    T_CLEAR = 1.5
    T_STARTUP = 2.5
    
    base_time = T_MIN + (v_count * T_CLEAR) + (q_length * T_STARTUP)
    
    if starvation_cycles > 2:
        base_time += (starvation_cycles * 10) 
        
    return int(max(T_MIN, min(base_time, T_MAX)))


def process_video_bg(payload: dict, job_id: str):
    cap = None
    out = None

    try:
        # Load model locally to reset tracker state for each job
        model = YOLO("yolov8n.pt")
        video_path = payload.get("videoPath")

        if not video_path or not os.path.exists(video_path):
            send_webhook({
                "job_id": job_id,
                "success": False,
                "message": "Video path not found"
            })
            return

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            send_webhook({
                "job_id": job_id,
                "success": False,
                "message": "Cannot open video"
            })
            return

        fps = cap.get(cv2.CAP_PROP_FPS)
        if not fps or fps <= 0:
            fps = 25.0
            
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        target_w, target_h = 1280, 720

        timestamp = int(time.time())
        filename = f"processed_{timestamp}.mp4"
        output_path = os.path.join(OUTPUT_DIR, filename)

        # 'avc1' is H.264 matching standard HTML5 video browser specs
        fourcc = cv2.VideoWriter_fourcc(*'avc1')
        PROCESS_EVERY_N_FRAMES = 4  # Drastically speeds up analysis (process 1, skip 3)
        effective_fps = max(fps / PROCESS_EVERY_N_FRAMES, 1.0)

        out = cv2.VideoWriter(output_path, fourcc, effective_fps, (target_w, target_h))

        if not out.isOpened():
            send_webhook({
                "job_id": job_id,
                "success": False,
                "message": "Failed to initialize MP4 video writer"
            })
            return

        crossed_ids = set()
        total_vehicles = 0
        vehicle_counts = defaultdict(int)
        
        # Fetch dynamic lane config
        active_lane_polygons = DEFAULT_LANE_POLYGONS.copy()
        try:
            cam_res = requests.get("http://localhost:5000/api/cameras/1", timeout=3)
            if cam_res.status_code == 200:
                cam_data = cam_res.json().get("data", {})
                lane_config_raw = cam_data.get("lane_config", [])
                if lane_config_raw and len(lane_config_raw) > 0:
                    active_lane_polygons = {}
                    for lc in lane_config_raw:
                        pts = lc.get("poly", [])
                        if len(pts) > 0:
                            active_lane_polygons[lc["lane"]] = np.array(pts, np.int32)
        except Exception as e:
            print("[WARN] Could not fetch dynamic lane config, using defaults.")

        lane_counts = {lane: 0 for lane in active_lane_polygons.keys()}

        vehicle_history = {}  # { tid: [(x, y, timestamp), ...] }
        QUEUE_THRESHOLD_PX_PER_SEC = 5.0

        frames = 0
        max_frame = 0
        trend = []
        q_length_trend = []
        conf_thres = 0.15
        
        starvation_cycles = 0  # mock tracker parameter in loop

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Skip frames to speed up processing vastly
            for _ in range(PROCESS_EVERY_N_FRAMES - 1):
                cap.read()

            frame = cv2.resize(frame, (target_w, target_h))
            frame = cv2.convertScaleAbs(frame, alpha=1.2, beta=15)
            frames += 1

            results = model.track(
                frame,
                persist=True,
                tracker="bytetrack.yaml",
                conf=conf_thres,
                imgsz=640,  # Increased to 640 for better accuracy on smaller/distant vehicles
                verbose=False,
            )

            count_frame = 0
            current_frame_counts = defaultdict(int)
            current_q_length = 0

            for lane_name, poly in active_lane_polygons.items():
                pts = poly.reshape((-1, 1, 2))
                cv2.polylines(
                    frame,
                    [pts],
                    isClosed=True,
                    color=(255, 255, 255),
                    thickness=1,
                )
                org = (int(poly[0][0]), int(poly[0][1]))
                cv2.putText(
                    frame,
                    lane_name,
                    org,
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (255, 255, 255),
                    1,
                )

            cv2.line(frame, (0, LINE_Y), (target_w, LINE_Y), (0, 0, 255), 2)
            cv2.putText(
                frame,
                "COUNTING LINE",
                (10, LINE_Y - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 255),
                2,
            )

            if results and len(results) > 0 and results[0].boxes is not None:
                boxes = results[0].boxes

                for box in boxes:
                    cls = int(box.cls[0].item()) if hasattr(box.cls[0], "item") else int(box.cls[0])
                    conf = float(box.conf[0].item()) if hasattr(box.conf[0], "item") else float(box.conf[0])

                    tid = -1
                    if box.id is not None:
                        tid = int(box.id[0].item()) if hasattr(box.id[0], "item") else int(box.id[0])

                    if cls in VEHICLE_CLASSES and tid != -1:
                        label = VEHICLE_CLASSES[cls]
                        count_frame += 1
                        current_frame_counts[label] += 1

                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        cx = int((x1 + x2) / 2)
                        cy = int((y1 + y2) / 2)

                        color = COLOR_MAP[label]

                        if tid not in vehicle_history:
                            vehicle_history[tid] = []
                            
                        history = vehicle_history[tid]
                        history.append((cx, cy, frames))
                        
                        # Keep history for up to 1.5 seconds of video time
                        max_history_frames = max(15, int(fps * 1.5))
                        history = [pt for pt in history if frames - pt[2] <= max_history_frames]
                        vehicle_history[tid] = history
                        
                        if len(history) >= 2:
                            old_x, old_y, old_frames = history[0]
                            dist = np.hypot(cx - old_x, cy - old_y)
                            # Convert frame difference back to seconds for speed calc
                            time_elapsed_secs = (frames - old_frames) / max(effective_fps, 1.0)
                            speed = dist / max(time_elapsed_secs, 0.001)
                            
                            if speed < QUEUE_THRESHOLD_PX_PER_SEC:
                                current_q_length += 1
                                
                        # Determine Line Crossing Logic Fallback (Robust against fast moving / skipped detections)
                        if len(history) >= 2:
                            oldest_y = history[0][1]
                            crossed_line = (
                                (oldest_y < LINE_Y and cy >= LINE_Y)
                                or (oldest_y > LINE_Y and cy <= LINE_Y)
                            )

                            if crossed_line and tid not in crossed_ids:
                                crossed_ids.add(tid)
                                total_vehicles += 1
                                vehicle_counts[label] += 1

                                assigned_lane = None
                                for lane_name, poly in active_lane_polygons.items():
                                    if cv2.pointPolygonTest(poly, (float(cx), float(cy)), False) >= 0:
                                        assigned_lane = lane_name
                                        break

                                if assigned_lane:
                                    lane_counts[assigned_lane] += 1
                                else:
                                    lane_index = min(len(active_lane_polygons.keys()) - 1, int(cx // (target_w / max(1, len(active_lane_polygons.keys())))))
                                    keys = list(active_lane_polygons.keys())
                                    if keys: lane_counts[keys[lane_index]] += 1

                        cv2.rectangle(
                            frame,
                            (int(x1), int(y1)),
                            (int(x2), int(y2)),
                            color,
                            2,
                        )
                        cv2.circle(frame, (cx, cy), 4, (0, 0, 255), -1)

                        text = f"ID:{tid} {label.upper()} {conf:.2f}"
                        (tw, th), _ = cv2.getTextSize(
                            text,
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.6,
                            2,
                        )
                        cv2.rectangle(
                            frame,
                            (int(x1), int(y1) - th - 8),
                            (int(x1) + tw, int(y1)),
                            color,
                            -1,
                        )
                        cv2.putText(
                            frame,
                            text,
                            (int(x1), int(y1) - 4),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.6,
                            (0, 0, 0),
                            2,
                        )

            max_frame = max(max_frame, count_frame)

            if frames % 25 == 0:
                trend.append(count_frame)
                q_length_trend.append(current_q_length)

                payload_live = {
                    "totalVehicles": total_vehicles,
                    "currentFrameCount": count_frame,
                    "vehicleTypes": dict(vehicle_counts),
                    "laneDensity": [
                        {"lane": k, "density": min(100, v * 5)}
                        for k, v in lane_counts.items()
                    ],
                }

                executor.submit(send_live_update, payload_live)

                # Send Webhook Progress
                current_frame = cap.get(cv2.CAP_PROP_POS_FRAMES)
                if total_frames > 0:
                    progress_pct = min(100, int((current_frame / total_frames) * 100))
                    executor.submit(send_webhook, {
                        "job_id": job_id,
                        "is_update": True,
                        "progress": progress_pct
                    })

            overlay = (
                f"T: {total_vehicles} | "
                f"C:{current_frame_counts['car']} "
                f"B:{current_frame_counts['bike']} "
                f"Bus:{current_frame_counts['bus']} "
                f"Tr:{current_frame_counts['truck']}"
            )

            cv2.putText(
                frame,
                overlay,
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (255, 255, 255),
                2,
            )

            out.write(frame)
            
        try:
            if out is not None:
                out.release()
        except Exception:
            pass

        if frames == 0:
            send_webhook({
                "job_id": job_id,
                "success": False,
                "message": "No frames processed"
            })
            return

        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            send_webhook({
                "job_id": job_id,
                "success": False,
                "message": "Processed video chunks corrupted or empty format."
            })
            return

        avg_per_frame = sum(trend) / len(trend) if trend else 0
        avg_q_length = sum(q_length_trend) / len(q_length_trend) if q_length_trend else 0
        density_val = get_density_value(avg_per_frame)
        signal = get_signal_time(avg_per_frame, avg_q_length, starvation_cycles=1)

        max_lane_value = max(lane_counts.values()) if max(lane_counts.values()) > 0 else 1
        final_lane_density = [
            {"lane": k, "density": int((v / max_lane_value) * 100)}
            for k, v in lane_counts.items()
        ]

        trend_data = [
            {"time": f"F{i + 1}", "vehicles": v}
            for i, v in enumerate(trend[-10:])
        ]

        result = {
            "success": True,
            "job_id": job_id,
            "totalVehicles": total_vehicles,
            "density": density_val,
            "vehicleTypes": dict(vehicle_counts),
            "laneDensity": final_lane_density,
            "trafficTrend": trend_data,
            "recommendedSignalTime": signal,
            "processedVideoPath": f"/processed/{filename}",
            "meta": {
                "frames": frames,
                "max": max_frame,
            },
        }

        send_webhook(result)

    except Exception as e:
        err = traceback.format_exc()
        print(err)
        send_webhook({
            "job_id": job_id,
            "success": False,
            "message": f"Server crash: {e}",
            "traceback": err,
        })
    finally:
        try:
            if cap is not None:
                cap.release()
        except Exception:
            pass

        try:
            if out is not None:
                out.release()
        except Exception:
            pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)