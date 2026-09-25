"""HTTP bridge for the Anushiyamercy YOLOv8/ByteTrack detector.

Run from the repository root with:
    uvicorn backend.api:app --reload --port 8000

The browser sends one JPEG frame at a time. RTSP/CCTV sources should be
connected to this server-side bridge, never directly to the browser.
"""
from pathlib import Path
import sys
from typing import Dict

import cv2
import numpy as np
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

DETECTOR_DIR = Path(__file__).parent / "classroom-occupancy-detector"
sys.path.insert(0, str(DETECTOR_DIR))

from detector import PersonDetector  # noqa: E402
from tracker import OccupancyTracker  # noqa: E402

app = FastAPI(title="Smart Campus Occupancy API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5179",
        "http://127.0.0.1:5179",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

detector = PersonDetector()
trackers: Dict[str, OccupancyTracker] = {}


@app.get("/health")
def health() -> dict:
    return {
        "ok": True,
        "detector": "yolov8-bytetrack" if detector.is_ready else "unavailable",
        "source": "Anushiyamercy/classroom-occupancy-detector",
    }


@app.post("/api/detect")
async def detect(request: Request) -> dict:
    room_id = request.headers.get("x-room-id", "browser-camera")
    capacity = max(int(request.headers.get("x-room-capacity", "1")), 1)
    image_bytes = await request.body()
    frame = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)

    if frame is None or frame.size == 0:
        return {"ok": False, "source": "demo", "error": "Invalid image frame"}
    if not detector.is_ready:
        return {"ok": False, "source": "demo", "count": 0, "confidence": 0, "status": "backend_unavailable"}

    tracker = trackers.setdefault(room_id, OccupancyTracker())
    detections = detector.detect_and_track(frame)
    count = tracker.update(detections)
    confidence = sum(item["confidence"] for item in detections) / len(detections) if detections else 0
    percentage = count / capacity * 100
    status = "EMPTY" if count == 0 else "CROWDED" if percentage >= 75 else "OCCUPIED"
    return {"ok": True, "source": "yolov8-bytetrack", "count": count, "confidence": round(confidence, 4), "percentage": round(percentage, 2), "status": status}
