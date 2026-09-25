"""
app.py
------
Streamlit dashboard for the Classroom Occupancy Detector.

Run with:
    streamlit run app.py
"""

import sys
import os
import time
import logging
import threading
import queue
from typing import Optional

import cv2
import numpy as np
import pandas as pd
import streamlit as st

# ── Local imports ─────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))

from config import (
    DEFAULT_CLASSROOM_NAME,
    DEFAULT_CLASSROOM_CAPACITY,
    CAMERA_INDEX,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    RECORD_INTERVAL_SEC,
    CONFIDENCE_THRESHOLD,
    TRACKER_TYPE,
    PAGE_TITLE,
    PAGE_ICON,
    LAYOUT,
)
from detector import PersonDetector
from tracker import OccupancyTracker
from database import DatabaseManager
from utils.helpers import (
    setup_logging,
    calculate_occupancy,
    get_status_color,
    get_status_emoji,
    IntervalTimer,
    format_percentage,
)

# ─────────────────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────────────────
setup_logging()
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Streamlit page configuration  (must be first Streamlit call)
# ─────────────────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title=PAGE_TITLE,
    page_icon=PAGE_ICON,
    layout=LAYOUT,
    initial_sidebar_state="expanded",
)


# ─────────────────────────────────────────────────────────────────────────────
# Custom CSS — professional dark-themed dashboard
# ─────────────────────────────────────────────────────────────────────────────
CUSTOM_CSS = """
<style>
/* ── Global ──────────────────────────────── */
[data-testid="stAppViewContainer"] {
    background: #0f1117;
    color: #e0e0e0;
}
[data-testid="stSidebar"] {
    background: #1a1d27;
    border-right: 1px solid #2e3250;
}
[data-testid="stSidebar"] label,
[data-testid="stSidebar"] .stSlider label,
[data-testid="stSidebar"] p {
    color: #c8cfe8 !important;
}

/* ── Header ─────────────────────────────── */
.header-container {
    background: linear-gradient(135deg, #1a1d27 0%, #252a3d 100%);
    border: 1px solid #2e3250;
    border-radius: 14px;
    padding: 22px 30px;
    margin-bottom: 20px;
    text-align: center;
}
.header-title {
    font-size: 2.1rem;
    font-weight: 800;
    letter-spacing: 3px;
    color: #4fc3f7;
    margin: 0;
}
.header-subtitle {
    font-size: 0.92rem;
    color: #8899bb;
    margin: 4px 0 0 0;
    letter-spacing: 1.5px;
}

/* ── Stat cards ─────────────────────────── */
.stat-card {
    background: #1e2235;
    border: 1px solid #2e3250;
    border-radius: 12px;
    padding: 18px 14px;
    text-align: center;
    transition: border-color .25s;
}
.stat-card:hover { border-color: #4fc3f7; }
.stat-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 1.8px;
    color: #7a8bb0;
    text-transform: uppercase;
    margin-bottom: 6px;
}
.stat-value {
    font-size: 2.4rem;
    font-weight: 900;
    color: #e8eaf6;
    line-height: 1;
}
.stat-unit {
    font-size: 1.1rem;
    font-weight: 500;
    color: #a0aacc;
}

/* ── Status badge ───────────────────────── */
.status-badge {
    display: inline-block;
    padding: 10px 32px;
    border-radius: 50px;
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    margin: 6px 0;
}

/* ── Section headers ────────────────────── */
.section-header {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 2px;
    color: #4fc3f7;
    text-transform: uppercase;
    padding: 6px 0 4px 0;
    border-bottom: 1px solid #2e3250;
    margin-bottom: 12px;
}

/* ── Camera placeholder ─────────────────── */
.cam-placeholder {
    background: #1e2235;
    border: 2px dashed #3a4060;
    border-radius: 12px;
    height: 340px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #5a6a8a;
    font-size: 1rem;
}

/* ── Alert box ──────────────────────────── */
.info-box {
    background: #1e2235;
    border-left: 4px solid #4fc3f7;
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 0.88rem;
    color: #c0ccdf;
    margin-top: 8px;
}

/* ── Sidebar button overrides ───────────── */
.stButton > button {
    width: 100%;
    border-radius: 8px;
    font-weight: 700;
    letter-spacing: 1px;
    transition: all .2s;
}

/* Streamlit image/video widget border */
[data-testid="stImage"] img {
    border-radius: 10px;
}
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


# ─────────────────────────────────────────────────────────────────────────────
# Session-state initialisation
# ─────────────────────────────────────────────────────────────────────────────

def _init_session() -> None:
    defaults = {
        "camera_running":  False,
        "people_count":    0,
        "frame_queue":     None,   # will hold the latest annotated frame
        "last_frame":      None,
        "detector":        None,
        "tracker":         None,
        "db":              None,
        "cap_thread":      None,
        "stop_event":      None,
        "source_type":     "webcam",  # "webcam" | "video"
        "video_path":      None,
        "frame_rgb":       None,
    }
    for key, val in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = val


_init_session()


# ─────────────────────────────────────────────────────────────────────────────
# Lazy singletons (detector, tracker, db)
# ─────────────────────────────────────────────────────────────────────────────

@st.cache_resource(show_spinner="Loading YOLO model…")
def get_detector(confidence: float) -> PersonDetector:
    return PersonDetector(confidence=confidence)


@st.cache_resource
def get_database() -> DatabaseManager:
    return DatabaseManager()


# ─────────────────────────────────────────────────────────────────────────────
# Background capture thread
# ─────────────────────────────────────────────────────────────────────────────

def _capture_loop(
    source,
    stop_event: threading.Event,
    frame_q: queue.Queue,
    confidence: float,
    tracker_cfg: str,
    record_interval: float,
    classroom: str,
    capacity: int,
    db: DatabaseManager,
) -> None:
    """
    Runs in a daemon thread.
    Captures frames, runs detection+tracking, pushes annotated frames to queue.
    Also writes DB records on `record_interval`.
    """
    detector = PersonDetector(confidence=confidence)
    tracker  = OccupancyTracker()
    db_timer = IntervalTimer(record_interval)

    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        logger.error("Cannot open video source: %s", source)
        frame_q.put({"error": f"Cannot open camera/video source: {source}"})
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

    logger.info("Capture loop started — source: %s", source)

    while not stop_event.is_set():
        ret, frame = cap.read()
        if not ret:
            # End of video file → loop it; for webcam this is a real error
            if isinstance(source, str):
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            else:
                logger.warning("Camera read failed.")
                break

        # Run detection + tracking
        if detector.is_ready:
            try:
                detections = detector.detect_and_track(frame, tracker=tracker_cfg)
            except Exception as exc:
                logger.debug("detect_and_track error: %s; falling back.", exc)
                detections = detector.detect(frame)
        else:
            detections = []

        count = tracker.update(detections)

        # Annotate frame
        annotated = detector.draw_detections(frame, detections)

        # Convert BGR → RGB for Streamlit
        rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)

        # Compute occupancy stats
        available, pct, status = calculate_occupancy(count, capacity)

        payload = {
            "frame":     rgb,
            "count":     count,
            "available": available,
            "pct":       pct,
            "status":    status,
            "error":     None,
        }

        # Drop stale frames; only keep the latest
        while not frame_q.empty():
            try:
                frame_q.get_nowait()
            except queue.Empty:
                break
        frame_q.put(payload)

        # Periodic DB write
        if db_timer.is_due():
            db.insert_record(
                classroom=classroom,
                capacity=capacity,
                people_detected=count,
                available_seats=available,
                occupancy_percentage=pct,
                status=status,
            )

    cap.release()
    tracker.reset()
    logger.info("Capture loop stopped.")


# ─────────────────────────────────────────────────────────────────────────────
# Camera control helpers
# ─────────────────────────────────────────────────────────────────────────────

def start_camera(
    source,
    confidence: float,
    classroom: str,
    capacity: int,
) -> None:
    if st.session_state["camera_running"]:
        return

    db         = get_database()
    frame_q    = queue.Queue(maxsize=4)
    stop_event = threading.Event()

    t = threading.Thread(
        target=_capture_loop,
        args=(
            source, stop_event, frame_q,
            confidence, TRACKER_TYPE,
            RECORD_INTERVAL_SEC, classroom, capacity, db,
        ),
        daemon=True,
        name="capture-loop",
    )
    t.start()

    st.session_state["camera_running"] = True
    st.session_state["frame_queue"]    = frame_q
    st.session_state["stop_event"]     = stop_event
    st.session_state["cap_thread"]     = t
    logger.info("Camera started.")


def stop_camera() -> None:
    if not st.session_state["camera_running"]:
        return
    stop_event = st.session_state.get("stop_event")
    if stop_event:
        stop_event.set()
    st.session_state["camera_running"] = False
    st.session_state["people_count"]   = 0
    st.session_state["frame_rgb"]      = None
    logger.info("Camera stopped.")


# ─────────────────────────────────────────────────────────────────────────────
# Sidebar
# ─────────────────────────────────────────────────────────────────────────────

def render_sidebar() -> dict:
    """Render sidebar controls and return current settings dict."""
    with st.sidebar:
        st.markdown(
            "<div style='text-align:center;padding:10px 0 16px'>"
            "<span style='font-size:2rem'>🎓</span><br>"
            "<span style='font-size:1rem;font-weight:700;color:#4fc3f7;"
            "letter-spacing:2px'>SETTINGS</span>"
            "</div>",
            unsafe_allow_html=True,
        )
        st.divider()

        # ── Classroom ──
        st.markdown("**🏫 Classroom**")
        classroom = st.text_input(
            "Classroom Name",
            value=DEFAULT_CLASSROOM_NAME,
            placeholder="e.g. CSE-101",
        )
        capacity = st.number_input(
            "Classroom Capacity",
            min_value=1, max_value=500,
            value=DEFAULT_CLASSROOM_CAPACITY,
            step=1,
        )

        st.divider()

        # ── Detection ──
        st.markdown("**🔍 Detection**")
        confidence = st.slider(
            "Confidence Threshold",
            min_value=0.10, max_value=0.90,
            value=CONFIDENCE_THRESHOLD,
            step=0.05,
            help="Higher = fewer false positives. Lower = more detections.",
        )

        st.divider()

        # ── Source ──
        st.markdown("**📷 Video Source**")
        source_type = st.radio(
            "Source",
            options=["Webcam", "Upload Video"],
            horizontal=True,
        )

        video_path = None
        cam_index  = CAMERA_INDEX
        if source_type == "Webcam":
            cam_index = st.number_input(
                "Camera Index", min_value=0, max_value=10, value=0
            )
            source = cam_index
        else:
            uploaded = st.file_uploader(
                "Upload a video file",
                type=["mp4", "avi", "mov", "mkv"],
            )
            if uploaded is not None:
                # Save temp file so OpenCV can read it
                tmp_dir = os.path.join(os.path.dirname(__file__), "assets", "images")
                os.makedirs(tmp_dir, exist_ok=True)
                video_path = os.path.join(tmp_dir, uploaded.name)
                with open(video_path, "wb") as f:
                    f.write(uploaded.read())
                source = video_path
                st.success(f"✅ Uploaded: {uploaded.name}")
            else:
                source = None

        st.divider()

        # ── Camera controls ──
        col_a, col_b = st.columns(2)
        with col_a:
            start_btn = st.button(
                "▶ Start",
                type="primary",
                disabled=st.session_state["camera_running"],
            )
        with col_b:
            stop_btn = st.button(
                "⏹ Stop",
                type="secondary",
                disabled=not st.session_state["camera_running"],
            )

        if start_btn and source is not None:
            start_camera(source, confidence, classroom, int(capacity))
            st.rerun()
        elif start_btn and source is None:
            st.error("Please upload a video file first.")

        if stop_btn:
            stop_camera()
            st.rerun()

        # Status indicator
        if st.session_state["camera_running"]:
            st.success("🟢  Camera is running")
        else:
            st.info("⚫  Camera is stopped")

        st.divider()
        st.markdown(
            "<div class='info-box'>"
            "<b>ℹ️ Note:</b> Detection accuracy depends on lighting, "
            "camera angle, and occlusion. This system does not perform "
            "facial recognition."
            "</div>",
            unsafe_allow_html=True,
        )

    return {
        "classroom":  classroom,
        "capacity":   int(capacity),
        "confidence": confidence,
        "source":     source if source_type == "Upload Video" else cam_index,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Header
# ─────────────────────────────────────────────────────────────────────────────

def render_header() -> None:
    st.markdown(
        """
        <div class="header-container">
            <p class="header-title">🎓 CLASSROOM OCCUPANCY DETECTOR</p>
            <p class="header-subtitle">
                COMPUTER VISION BASED REAL-TIME MONITORING SYSTEM
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Stat cards
# ─────────────────────────────────────────────────────────────────────────────

def render_stat_cards(
    capacity: int,
    people: int,
    available: int,
    pct: float,
    status: str,
) -> None:
    color  = get_status_color(status)
    emoji  = get_status_emoji(status)

    c1, c2, c3, c4 = st.columns(4)

    def _card(col, label, value, unit="", color_override=None):
        val_color = color_override or "#e8eaf6"
        col.markdown(
            f"""
            <div class="stat-card">
                <div class="stat-label">{label}</div>
                <div class="stat-value" style="color:{val_color}">{value}
                    <span class="stat-unit">{unit}</span>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    _card(c1, "🏫 Classroom Capacity", capacity)
    _card(c2, "👥 People Detected",    people, color_override="#4fc3f7")
    _card(c3, "💺 Available Seats",    available,
          color_override="#2ecc71" if available > 0 else "#e74c3c")
    _card(c4, "📊 Occupancy",          f"{pct:.1f}", "%",
          color_override=color)

    # Status badge
    st.markdown(
        f"""
        <div style="text-align:center;margin:14px 0 6px">
            <span class="status-badge"
                  style="background:{color}22;color:{color};
                         border:2px solid {color};">
                {emoji} &nbsp; {status}
            </span>
        </div>
        """,
        unsafe_allow_html=True,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Camera feed
# ─────────────────────────────────────────────────────────────────────────────

def render_camera_feed(
    frame_placeholder,
    frame_q: Optional[queue.Queue],
    people_placeholder,
    status_placeholder,
    capacity: int,
) -> dict:
    """
    Poll the frame queue and update camera + stat placeholders.
    Returns latest stats dict.
    """
    stats = {"count": 0, "available": capacity, "pct": 0.0, "status": "AVAILABLE"}

    if frame_q is None or not st.session_state["camera_running"]:
        frame_placeholder.markdown(
            """<div class="cam-placeholder">
                <span style="font-size:3rem">📷</span><br>
                <span>Camera is not running</span><br>
                <span style="font-size:.8rem;margin-top:6px">
                    Press <b>▶ Start</b> in the sidebar to begin
                </span>
            </div>""",
            unsafe_allow_html=True,
        )
        return stats

    try:
        payload = frame_q.get(timeout=0.12)
    except queue.Empty:
        # No new frame yet — show last one if available
        last = st.session_state.get("frame_rgb")
        if last is not None:
            frame_placeholder.image(last, channels="RGB", use_container_width=True)
        return stats

    if payload.get("error"):
        frame_placeholder.error(f"🚫 {payload['error']}")
        stop_camera()
        return stats

    rgb   = payload["frame"]
    count = payload["count"]
    avail = payload["available"]
    pct   = payload["pct"]
    stat  = payload["status"]

    # Save last frame
    st.session_state["frame_rgb"] = rgb

    frame_placeholder.image(rgb, channels="RGB", use_container_width=True)
    return {"count": count, "available": avail, "pct": pct, "status": stat}


# ─────────────────────────────────────────────────────────────────────────────
# History section
# ─────────────────────────────────────────────────────────────────────────────

def render_history(db: DatabaseManager, classroom: str) -> None:
    st.markdown("<div class='section-header'>📈 Occupancy History</div>",
                unsafe_allow_html=True)

    records = db.get_recent_records(classroom=classroom, limit=200)

    if not records:
        st.info("No history records yet. Start the camera to begin recording.")
        return

    df = pd.DataFrame(records)

    # ── Chart ──────────────────────────────────────────────────────────────
    # Build a time-axis label from date + time columns
    df["datetime"] = pd.to_datetime(df["date"] + " " + df["time"])
    df = df.sort_values("datetime")

    chart_df = df[["datetime", "occupancy_percentage", "people_detected"]].copy()
    chart_df = chart_df.rename(columns={
        "datetime":             "Time",
        "occupancy_percentage": "Occupancy %",
        "people_detected":      "People",
    })
    chart_df = chart_df.set_index("Time")

    st.line_chart(chart_df["Occupancy %"], height=220)

    # ── Table ───────────────────────────────────────────────────────────────
    with st.expander("📋 Detailed Records", expanded=False):
        display_df = df[[
            "date", "time", "classroom", "capacity",
            "people_detected", "available_seats",
            "occupancy_percentage", "status",
        ]].copy()
        display_df.columns = [
            "Date", "Time", "Classroom", "Capacity",
            "Detected", "Available", "Occupancy %", "Status",
        ]
        display_df["Occupancy %"] = display_df["Occupancy %"].map("{:.1f}%".format)
        st.dataframe(
            display_df.iloc[::-1].reset_index(drop=True),
            use_container_width=True,
            height=300,
        )

    # ── Quick stats ─────────────────────────────────────────────────────────
    if len(df) > 0:
        cols = st.columns(4)
        cols[0].metric("Avg Occupancy",
                       f"{df['occupancy_percentage'].mean():.1f}%")
        cols[1].metric("Peak Detected",
                       int(df["people_detected"].max()))
        cols[2].metric("Min Detected",
                       int(df["people_detected"].min()))
        cols[3].metric("Total Records",
                       len(df))


# ─────────────────────────────────────────────────────────────────────────────
# Test-cases section
# ─────────────────────────────────────────────────────────────────────────────

def render_test_cases() -> None:
    with st.expander("🧪 Test Cases — Occupancy Logic", expanded=False):
        test_cases = [
            ("Empty Classroom",     60,  0),
            ("Partially Occupied",  60, 30),
            ("Nearly Full",         60, 48),
            ("Full",                60, 60),
            ("Over Capacity",       60, 65),
        ]
        rows = []
        for name, cap, det in test_cases:
            avail, pct, status = calculate_occupancy(det, cap)
            rows.append({
                "Scenario":    name,
                "Capacity":    cap,
                "Detected":    det,
                "Available":   avail,
                "Occupancy %": f"{pct:.1f}%",
                "Status":      status,
            })
        st.dataframe(pd.DataFrame(rows), use_container_width=True)


# ─────────────────────────────────────────────────────────────────────────────
# Main app
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    # ── Sidebar ──────────────────────────────────────────────────────────────
    settings = render_sidebar()
    classroom = settings["classroom"]
    capacity  = settings["capacity"]

    # ── Header ───────────────────────────────────────────────────────────────
    render_header()

    # ── DB singleton ─────────────────────────────────────────────────────────
    db = get_database()

    # ── Poll frame queue ──────────────────────────────────────────────────────
    frame_q = st.session_state.get("frame_queue")
    latest: dict = {"count": 0, "available": capacity, "pct": 0.0, "status": "AVAILABLE"}

    if st.session_state["camera_running"] and frame_q:
        try:
            payload = frame_q.get(timeout=0.15)
            if payload.get("error"):
                st.error(f"🚫 {payload['error']}")
                stop_camera()
            else:
                st.session_state["frame_rgb"]    = payload["frame"]
                st.session_state["people_count"] = payload["count"]
                latest = payload
        except queue.Empty:
            # Use cached values
            cached_count = st.session_state.get("people_count", 0)
            avail, pct, stat = calculate_occupancy(cached_count, capacity)
            latest = {
                "count":     cached_count,
                "available": avail,
                "pct":       pct,
                "status":    stat,
            }

    # ── Stat cards ────────────────────────────────────────────────────────────
    render_stat_cards(
        capacity  = capacity,
        people    = latest["count"],
        available = latest["available"],
        pct       = latest["pct"],
        status    = latest["status"],
    )

    st.markdown("<br>", unsafe_allow_html=True)

    # ── Camera feed + sidebar info ────────────────────────────────────────────
    cam_col, info_col = st.columns([3, 1])

    with cam_col:
        st.markdown("<div class='section-header'>📷 Live Camera Feed</div>",
                    unsafe_allow_html=True)
        frame_slot = st.empty()

        last_rgb = st.session_state.get("frame_rgb")
        if last_rgb is not None:
            frame_slot.image(last_rgb, channels="RGB", use_container_width=True)
        elif st.session_state["camera_running"]:
            frame_slot.markdown(
                """<div class="cam-placeholder">
                    <span style="font-size:2rem">⏳</span><br>
                    Waiting for first frame…
                </div>""",
                unsafe_allow_html=True,
            )
        else:
            frame_slot.markdown(
                """<div class="cam-placeholder">
                    <span style="font-size:3rem">📷</span><br>
                    <span>Camera is not running</span><br>
                    <span style="font-size:.8rem;margin-top:6px">
                        Press <b>▶ Start</b> in the sidebar
                    </span>
                </div>""",
                unsafe_allow_html=True,
            )

    with info_col:
        st.markdown("<div class='section-header'>ℹ️ Live Info</div>",
                    unsafe_allow_html=True)

        color = get_status_color(latest["status"])
        emoji = get_status_emoji(latest["status"])

        st.markdown(
            f"""
            <div style="background:#1e2235;border:1px solid #2e3250;
                        border-radius:10px;padding:16px 12px;">
                <div style="font-size:.72rem;color:#7a8bb0;
                            letter-spacing:1.5px;font-weight:700">STATUS</div>
                <div style="font-size:1.3rem;font-weight:900;color:{color};
                            margin:6px 0;">{emoji} {latest['status']}</div>
                <hr style="border-color:#2e3250;margin:10px 0">
                <div style="font-size:.75rem;color:#7a8bb0;font-weight:700">
                    CLASSROOM</div>
                <div style="color:#c8d0e8;font-size:.95rem;margin-bottom:8px">
                    {classroom}</div>
                <div style="font-size:.75rem;color:#7a8bb0;font-weight:700">
                    CAPACITY</div>
                <div style="color:#c8d0e8;font-size:.95rem;margin-bottom:8px">
                    {capacity}</div>
                <div style="font-size:.75rem;color:#7a8bb0;font-weight:700">
                    DETECTED</div>
                <div style="color:#4fc3f7;font-size:.95rem;margin-bottom:8px">
                    {latest['count']} people</div>
                <div style="font-size:.75rem;color:#7a8bb0;font-weight:700">
                    AVAILABLE</div>
                <div style="color:#2ecc71;font-size:.95rem;">
                    {latest['available']} seats</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        st.markdown("<br>", unsafe_allow_html=True)

        # Progress bar
        pct_clamped = min(latest["pct"], 100.0)
        st.markdown(
            f"<div style='font-size:.72rem;color:#7a8bb0;letter-spacing:1.5px;"
            f"font-weight:700;margin-bottom:4px'>OCCUPANCY</div>",
            unsafe_allow_html=True,
        )
        st.progress(int(pct_clamped))
        st.markdown(
            f"<div style='text-align:center;color:{color};"
            f"font-weight:800;font-size:1.1rem'>{latest['pct']:.1f}%</div>",
            unsafe_allow_html=True,
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # ── History ───────────────────────────────────────────────────────────────
    render_history(db, classroom)

    st.markdown("<br>", unsafe_allow_html=True)

    # ── Test cases ────────────────────────────────────────────────────────────
    render_test_cases()

    # ── Footer ────────────────────────────────────────────────────────────────
    st.markdown(
        """
        <hr style="border-color:#2e3250;margin-top:24px">
        <div style="text-align:center;color:#4a5578;font-size:.78rem;padding:8px 0">
            🎓 Classroom Occupancy Detector &nbsp;|&nbsp;
            Computer Vision Project &nbsp;|&nbsp;
            YOLOv8 + ByteTrack + Streamlit &nbsp;|&nbsp;
            Privacy-first: No facial recognition
        </div>
        """,
        unsafe_allow_html=True,
    )

    # ── Auto-refresh while camera is running ──────────────────────────────────
    if st.session_state["camera_running"]:
        time.sleep(0.10)   # brief yield so Streamlit rerenders
        st.rerun()


if __name__ == "__main__":
    main()

