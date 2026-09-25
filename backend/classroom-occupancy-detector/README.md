# Classroom Occupancy Detector
### Computer Vision Based Real-Time Monitoring System

![Python](https://img.shields.io/badge/Python-3.9%2B-blue)
![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-red)
![Streamlit](https://img.shields.io/badge/Dashboard-Streamlit-ff4b4b)
![OpenCV](https://img.shields.io/badge/OpenCV-4.8%2B-green)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightgrey)

---

## 📋 Project Description

A **real-time classroom occupancy detection and monitoring system** built with
Python and Computer Vision.

The system uses a webcam (or pre-recorded video) to:
- Detect and count people in the classroom using **YOLOv8** object detection
- Track individual persons across frames using **ByteTrack** to avoid double-counting
- Calculate occupancy percentage, available seats and classroom status
- Display everything on a **modern Streamlit dashboard** that updates live
- Store periodic occupancy snapshots in a **SQLite** database for history analysis

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 Person Detection | YOLOv8 detects only persons — ignores bags, chairs, laptops |
| 🔢 Stable Counting | ByteTrack assigns IDs; people aren't counted multiple times |
| 📊 Live Dashboard | Professional dark-themed Streamlit dashboard |
| 💺 Seat Availability | Available = Capacity − Detected (min 0) |
| 🚦 Status Indicators | AVAILABLE / NEARLY FULL / FULL / OVER CAPACITY |
| 📈 Occupancy History | SQLite storage + line chart of occupancy over time |
| 📹 Video Upload | Test with a pre-recorded video if webcam is unavailable |
| ⚙️ Configurable | Capacity, classroom name, confidence threshold all adjustable |
| 🔒 Privacy | No facial recognition — only count, no identity |

---

## 🛠️ Technologies Used

- **Python 3.9+**
- **YOLOv8** (Ultralytics) — Person detection
- **ByteTrack** — Multi-object tracking (built into Ultralytics)
- **OpenCV** — Frame capture, preprocessing, annotation
- **Streamlit** — Real-time web dashboard
- **SQLite** — Occupancy history storage
- **NumPy** — Array operations
- **Pandas** — History data manipulation and display

---

## 💻 System Requirements

| Component | Minimum |
|-----------|---------|
| OS | Windows 10/11, Ubuntu 20.04+, macOS 12+ |
| Python | 3.9 or higher |
| RAM | 4 GB (8 GB recommended) |
| CPU | Any modern multi-core CPU |
| GPU | Optional (CUDA GPU greatly improves speed) |
| Camera | Webcam or video file for testing |
| Storage | ~500 MB (for model weights + database) |

---

## 🚀 Installation

### Step 1 — Clone / download the project

```bash
cd classroom_occupancy_detector
```

### Step 2 — (Optional) Create a virtual environment

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux / macOS
source venv/bin/activate
```

### Step 3 — Install dependencies

```bash
pip install -r requirements.txt
```

> **Note:** `torch` (PyTorch) is installed automatically by `ultralytics`.
> For GPU support, follow the instructions at https://pytorch.org/get-started/locally/

---

## 🤖 YOLO Model

The model (`yolov8n.pt`) is **downloaded automatically** by Ultralytics on the
first run.  No manual download is needed.

If you want to use a larger/more accurate model, edit `config.py`:

```python
YOLO_MODEL_NAME = "yolov8s.pt"   # small — better accuracy, still fast
```

Available models: `yolov8n`, `yolov8s`, `yolov8m`, `yolov8l`, `yolov8x`

---

## ▶️ Running the Application

```bash
streamlit run app.py
```

The dashboard opens automatically in your browser at `http://localhost:8501`.

---

## 🖥️ Using the Dashboard

1. **Set Classroom Name** in the sidebar (e.g. `CSE-101`)
2. **Set Capacity** (e.g. `60`)
3. **Adjust Confidence Threshold** if needed (default 0.40 works well)
4. **Choose Source** — Webcam or upload a video file
5. Click **▶ Start** to begin detection
6. Watch the live feed update with bounding boxes and counts
7. Click **⏹ Stop** when done

---

## 🏗️ Project Architecture

```
classroom_occupancy_detector/
│
├── app.py          ← Streamlit dashboard + background capture thread
├── detector.py     ← YOLOv8 person detection + frame annotation
├── tracker.py      ← Occupancy counting with ID-based tracking
├── database.py     ← SQLite manager (insert, query, schema)
├── config.py       ← All configuration constants in one place
├── requirements.txt
├── README.md
│
├── models/         ← YOLO .pt files (auto-downloaded)
├── database/       ← occupancy.db (auto-created)
├── assets/images/  ← Temp storage for uploaded videos
└── utils/
    └── helpers.py  ← Occupancy math, status lookup, utilities
```

---

## 📐 Occupancy Calculation

```
Available Seats     = max(0,  Capacity − People Detected)

Occupancy %         = (People Detected / Capacity) × 100
```

### Status Thresholds

| Occupancy Range | Status |
|----------------|--------|
| 0% – 69% | 🟢 AVAILABLE |
| 70% – 89% | 🟡 NEARLY FULL |
| 90% – 100% | 🔴 FULL |
| > 100% | 🟣 OVER CAPACITY |

---

## 🧪 Testing Procedure

### Automatic Test Cases

Open the **🧪 Test Cases** panel in the dashboard.
The system runs five built-in scenarios against the occupancy logic and shows
expected vs. actual results.

### Manual Testing

| Scenario | What to Check |
|----------|--------------|
| No one in front of camera | Count = 0, Status = AVAILABLE |
| Stand in front of camera | Count increases, status updates |
| Walk out of frame | Count decreases |
| Upload crowd video | Multiple bounding boxes appear |

---

## ⚠️ Limitations

- Detection accuracy depends on **lighting conditions**
- **Occlusion** (people hidden behind others) reduces accuracy
- Very **crowded classrooms** may cause missed detections
- **Low-resolution cameras** reduce detection quality
- The system counts people **visible to the camera** — hidden areas are not covered
- Accuracy is typically **85–95%** under good conditions (not 100%)

---

## 🔮 Future Enhancements

- Multiple camera support / CCTV/IP camera integration
- Multi-classroom dashboard
- Mobile push notifications when capacity is reached
- Email alerts
- PDF report generation
- Daily / weekly / monthly analytics reports
- Cloud database (PostgreSQL, Firebase)
- Admin login with authentication
- Occupancy prediction using historical trends
- QR code display for room information
- Integration with student attendance systems

---

## 🔒 Privacy

This system:
- ✅ Detects and **counts** people only
- ✅ Draws bounding boxes around people (no identity)
- ❌ Does **NOT** perform facial recognition
- ❌ Does **NOT** store face images
- ❌ Does **NOT** identify individuals by name

---

## 📄 License

This project is for educational purposes as a college Computer Vision project.

