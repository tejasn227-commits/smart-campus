"""
detector.py
-----------
YOLO-based person detector using Ultralytics.

Responsibilities:
  - Load the YOLO model (downloads automatically on first run).
  - Run inference on a single BGR frame.
  - Filter detections to the "person" class only.
  - Draw bounding boxes + labels on the frame.
  - Return structured detection results.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple

import cv2
import numpy as np

from config import (
    YOLO_MODEL_NAME,
    CONFIDENCE_THRESHOLD,
    IOU_THRESHOLD,
    PERSON_CLASS_ID,
    BBOX_COLOR,
    BBOX_THICKNESS,
    LABEL_FONT_SCALE,
    LABEL_THICKNESS,
    LABEL_COLOR,
    LABEL_BG_COLOR,
)

logger = logging.getLogger(__name__)


class PersonDetector:
    """
    Wraps an Ultralytics YOLO model to detect persons in video frames.

    Usage
    -----
    detector = PersonDetector()
    results  = detector.detect(frame)
    annotated = detector.draw(frame, results)
    """

    def __init__(
        self,
        model_name: str = YOLO_MODEL_NAME,
        confidence: float = CONFIDENCE_THRESHOLD,
        iou: float = IOU_THRESHOLD,
    ):
        self.model_name  = model_name
        self.confidence  = confidence
        self.iou         = iou
        self.model       = None
        self._load_model()

    # ── Model loading ─────────────────────────────────────────────────────────

    def _load_model(self) -> None:
        """
        Attempt to load the YOLO model.
        Model weights are downloaded automatically by Ultralytics if absent.
        """
        try:
            from ultralytics import YOLO  # local import so app can run without it
            self.model = YOLO(self.model_name)
            logger.info("YOLO model '%s' loaded successfully.", self.model_name)
        except ImportError:
            logger.error(
                "Ultralytics is not installed. Run: pip install ultralytics"
            )
            self.model = None
        except Exception as exc:
            logger.error("Failed to load YOLO model: %s", exc)
            self.model = None

    @property
    def is_ready(self) -> bool:
        """True if the model loaded successfully."""
        return self.model is not None

    # ── Detection ─────────────────────────────────────────────────────────────

    def detect(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Run YOLO inference on a BGR frame.

        Returns
        -------
        list of dicts:
            {
              "bbox":       [x1, y1, x2, y2],   # absolute pixel coords
              "confidence": float,
              "class_id":   int,
              "track_id":   int | None,
            }
        """
        if not self.is_ready or frame is None or frame.size == 0:
            return []

        try:
            results = self.model.predict(
                source=frame,
                conf=self.confidence,
                iou=self.iou,
                classes=[PERSON_CLASS_ID],  # only persons
                verbose=False,
            )
        except Exception as exc:
            logger.error("Detection error: %s", exc)
            return []

        return self._parse_results(results)

    def detect_and_track(self, frame: np.ndarray, tracker: str = "bytetrack.yaml") -> List[Dict[str, Any]]:
        """
        Run YOLO tracking (detection + ByteTrack assignment) on a BGR frame.
        """
        if not self.is_ready or frame is None or frame.size == 0:
            return []

        try:
            results = self.model.track(
                source=frame,
                conf=self.confidence,
                iou=self.iou,
                classes=[PERSON_CLASS_ID],
                persist=True,
                tracker=tracker,
                verbose=False,
            )
        except Exception as exc:
            # Fall back to plain detection if tracking fails
            logger.warning("Tracking failed (%s); falling back to detection.", exc)
            return self.detect(frame)

        return self._parse_results(results)

    # ── Parsing ───────────────────────────────────────────────────────────────

    @staticmethod
    def _parse_results(results) -> List[Dict[str, Any]]:
        """Convert Ultralytics Results objects to plain dicts."""
        detections: List[Dict[str, Any]] = []

        for result in results:
            if result.boxes is None:
                continue
            boxes = result.boxes

            for i in range(len(boxes)):
                try:
                    # Bounding box in xyxy format
                    xyxy = boxes.xyxy[i].cpu().numpy().astype(int).tolist()
                    conf = float(boxes.conf[i].cpu().numpy())
                    cls  = int(boxes.cls[i].cpu().numpy())

                    # Track ID (None when plain detection used)
                    track_id = None
                    if boxes.id is not None:
                        track_id = int(boxes.id[i].cpu().numpy())

                    detections.append(
                        {
                            "bbox":       xyxy,
                            "confidence": conf,
                            "class_id":   cls,
                            "track_id":   track_id,
                        }
                    )
                except Exception as exc:
                    logger.debug("Skipping malformed detection: %s", exc)

        return detections

    # ── Annotation ────────────────────────────────────────────────────────────

    def draw_detections(
        self,
        frame: np.ndarray,
        detections: List[Dict[str, Any]],
    ) -> np.ndarray:
        """
        Draw bounding boxes and labels on a copy of `frame`.

        Each person is labelled "Person N" where N is their sequential index
        (1-based) or the tracker ID if available.
        """
        annotated = frame.copy()

        for idx, det in enumerate(detections, start=1):
            x1, y1, x2, y2 = det["bbox"]
            track_id        = det.get("track_id")
            conf            = det.get("confidence", 0.0)

            # Clamp coords to frame bounds
            h, w = annotated.shape[:2]
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w - 1, x2), min(h - 1, y2)

            # Label text
            if track_id is not None:
                label = f"Person #{track_id}  {conf:.0%}"
            else:
                label = f"Person {idx}  {conf:.0%}"

            # Draw bounding box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), BBOX_COLOR, BBOX_THICKNESS)

            # Draw label background
            (tw, th), baseline = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, LABEL_FONT_SCALE, LABEL_THICKNESS
            )
            lx1, ly1 = x1, max(y1 - th - baseline - 4, 0)
            lx2, ly2 = x1 + tw + 4, y1
            cv2.rectangle(annotated, (lx1, ly1), (lx2, ly2), LABEL_BG_COLOR, -1)

            # Draw label text
            cv2.putText(
                annotated,
                label,
                (x1 + 2, max(y1 - baseline - 2, th)),
                cv2.FONT_HERSHEY_SIMPLEX,
                LABEL_FONT_SCALE,
                LABEL_COLOR,
                LABEL_THICKNESS,
                cv2.LINE_AA,
            )

        # Overlay summary count
        count_text = f"People: {len(detections)}"
        cv2.putText(
            annotated,
            count_text,
            (10, 28),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 0, 0),
            3,
            cv2.LINE_AA,
        )
        cv2.putText(
            annotated,
            count_text,
            (10, 28),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 255, 180),
            2,
            cv2.LINE_AA,
        )

        return annotated

    def update_confidence(self, confidence: float) -> None:
        """Allow the dashboard to adjust the confidence threshold at runtime."""
        self.confidence = max(0.1, min(0.99, confidence))

