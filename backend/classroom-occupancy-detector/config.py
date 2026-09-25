"""
config.py
---------
Central configuration for the Classroom Occupancy Detector.
All tunable values live here; no magic numbers scattered in other files.
"""

import os

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
DATABASE_DIR  = os.path.join(BASE_DIR, "database")
DATABASE_PATH = os.path.join(DATABASE_DIR, "occupancy.db")
MODELS_DIR    = os.path.join(BASE_DIR, "models")

# ─── Camera / Video ───────────────────────────────────────────────────────────
CAMERA_INDEX       = 0          # 0 = default webcam; change if using external cam
FRAME_WIDTH        = 640        # Capture resolution width
FRAME_HEIGHT       = 480        # Capture resolution height
TARGET_FPS         = 15         # Processing frame-rate target

# ─── YOLO Detection ───────────────────────────────────────────────────────────
YOLO_MODEL_NAME        = "yolov8n.pt"   # nano model – fast enough for real-time
CONFIDENCE_THRESHOLD   = 0.40           # Minimum confidence to accept a detection
IOU_THRESHOLD          = 0.45           # NMS IoU threshold
PERSON_CLASS_ID        = 0              # COCO class 0 = "person"

# ─── Tracking ─────────────────────────────────────────────────────────────────
TRACKER_TYPE    = "bytetrack.yaml"  # Ultralytics built-in tracker config

# ─── Classroom Defaults ───────────────────────────────────────────────────────
DEFAULT_CLASSROOM_NAME    = "CSE-101"
DEFAULT_CLASSROOM_CAPACITY = 60

# ─── Occupancy Thresholds (%) ─────────────────────────────────────────────────
THRESHOLD_AVAILABLE    = 70   # 0 – 69   → AVAILABLE
THRESHOLD_NEARLY_FULL  = 90   # 70 – 89  → NEARLY FULL
THRESHOLD_FULL         = 100  # 90 – 100 → FULL
                               # >100     → OVER CAPACITY

# ─── Status Labels & Colours ──────────────────────────────────────────────────
STATUS_AVAILABLE    = "AVAILABLE"
STATUS_NEARLY_FULL  = "NEARLY FULL"
STATUS_FULL         = "FULL"
STATUS_OVER_CAP     = "OVER CAPACITY"

STATUS_COLORS = {
    STATUS_AVAILABLE:   "#2ecc71",   # green
    STATUS_NEARLY_FULL: "#f39c12",   # orange
    STATUS_FULL:        "#e74c3c",   # red
    STATUS_OVER_CAP:    "#8e44ad",   # purple
}

STATUS_EMOJIS = {
    STATUS_AVAILABLE:   "🟢",
    STATUS_NEARLY_FULL: "🟡",
    STATUS_FULL:        "🔴",
    STATUS_OVER_CAP:    "🟣",
}

# ─── Database / Logging ───────────────────────────────────────────────────────
RECORD_INTERVAL_SEC = 5      # How often to write an occupancy record (seconds)

# ─── Bounding Box Style ───────────────────────────────────────────────────────
BBOX_COLOR        = (0, 255, 0)    # BGR green
BBOX_THICKNESS    = 2
LABEL_FONT_SCALE  = 0.55
LABEL_THICKNESS   = 1
LABEL_COLOR       = (255, 255, 255)  # white text
LABEL_BG_COLOR    = (0, 200, 0)      # green background

# ─── Streamlit page config ────────────────────────────────────────────────────
PAGE_TITLE  = "Classroom Occupancy Detector"
PAGE_ICON   = "🎓"
LAYOUT      = "wide"

