# Smart Adaptive Traffic Management System 🚦

An AI-driven, real-time traffic management system designed to optimize traffic signals dynamically based on live vehicle density, track emergency vehicles, and provide a sophisticated dashboard for monitoring. 

This project aims to reduce congestion, fuel waste, and emergency response times using computer vision and mathematical signal optimization (Webster's Delay Formula).

---

## 🌟 Key Features

- **Dynamic Signal Timing**: Green light durations are calculated mathematically using queue lengths and vehicle counts, discarding static timers.
- **AI Vehicle Tracking**: Uses YOLOv8 and ByteTrack to accurately classify and track cars, bikes, buses, and trucks across counting lines.
- **Emergency Responder Override**: Automatically detects emergency vehicles and reroutes traffic by overriding the target lane's signal to Green.
- **JARVIS Voice Alerts**: Real-time automated audio announcements for critical alerts (e.g., severe congestion, incoming ambulances).
- **Live Command Dashboard**: Built with React & Recharts to provide real-time streaming, spectrum analysis, and density mapping.

---

## 🛠️ Tech Stack

The system is split into three independent microservices:
1. **Frontend**: React, TypeScript, Vite, Tailwind CSS, WebSockets.
2. **Backend**: Node.js, Express, PostgreSQL (or In-Memory fallback), WebSockets.
3. **AI Service**: Python, FastAPI, YOLOv8, OpenCV.

---

## 🚀 How to Run the Project

You will need to run all three services in separate terminal windows.

### 1. Start the Node.js Backend
The backend serves as the bridge between the AI and the Frontend.

```bash
cd backend
npm install
npm start
```
*The backend will run on `http://localhost:5000`.*

### 2. Start the Python AI Service
The AI service processes the video streams and performs object detection.

```bash
cd ai-service
# (Optional but recommended) Create a virtual environment
# python -m venv venv
# source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt
python main.py
```
*The AI service will run on `http://localhost:8001`.*

### 3. Start the Frontend Dashboard
The command center UI.

```bash
cd Frontend
npm install
npm run dev
```
*The frontend will run on the local Vite server (usually `http://localhost:5173`).*

---

## 💡 Usage

1. Open the frontend in your browser.
2. Navigate to the **Upload Video** tab and upload a test traffic video.
3. Go to the **Live Feed** or **Simulation** tab to trigger the AI analysis.
4. Watch the AI process the video in real-time, update the signal queues, and trigger alerts/announcements!
