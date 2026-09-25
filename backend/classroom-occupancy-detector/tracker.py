"""
tracker.py
----------
Occupancy counter that converts raw per-frame detections into a stable
"current head-count" number.

The Ultralytics ByteTrack integration already handles identity persistence,
so this module focuses on:
  - Maintaining the active set of track IDs seen in recent frames
  - Smoothing the displayed count so it does not flicker on every frame
  - Optionally falling back to a moving-average when tracking IDs are absent
"""

import time
import logging
from collections import deque
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


class OccupancyTracker:
    """
    Converts a stream of per-frame detection dicts into a stable people count.

    Parameters
    ----------
    smoothing_window : int
        Number of recent frames used for the rolling-average fallback.
    id_timeout_sec : float
        Seconds before a track ID is considered gone (evicted from active set).
    """

    def __init__(
        self,
        smoothing_window: int = 8,
        id_timeout_sec: float = 2.0,
    ):
        self.smoothing_window = smoothing_window
        self.id_timeout_sec   = id_timeout_sec

        # Track-ID → last-seen timestamp
        self._active_tracks: Dict[int, float] = {}

        # Rolling raw counts for fallback smoothing
        self._count_history: deque = deque(maxlen=smoothing_window)

        # Final stable count
        self._stable_count: int = 0

    # ── Public API ────────────────────────────────────────────────────────────

    def update(self, detections: List[Dict[str, Any]]) -> int:
        """
        Feed the latest frame's detections and return the current head-count.

        If track IDs are present the count comes from the live-ID set;
        otherwise a smoothed average of raw detection counts is used.
        """
        now = time.time()
        has_ids = any(d.get("track_id") is not None for d in detections)

        if has_ids:
            self._stable_count = self._update_with_ids(detections, now)
        else:
            self._stable_count = self._update_with_smoothing(detections)

        return self._stable_count

    @property
    def count(self) -> int:
        """Current stable head-count."""
        return self._stable_count

    def reset(self) -> None:
        """Clear all tracked state (e.g. when camera restarts)."""
        self._active_tracks.clear()
        self._count_history.clear()
        self._stable_count = 0

    # ── Private helpers ───────────────────────────────────────────────────────

    def _update_with_ids(
        self, detections: List[Dict[str, Any]], now: float
    ) -> int:
        """
        Maintain a set of active track IDs with timeout-based eviction.
        Returns the number of currently active IDs.
        """
        # Refresh last-seen time for every detection in this frame
        for det in detections:
            tid = det.get("track_id")
            if tid is not None:
                self._active_tracks[tid] = now

        # Evict IDs that haven't been seen within the timeout window
        stale = [
            tid
            for tid, last_seen in self._active_tracks.items()
            if (now - last_seen) > self.id_timeout_sec
        ]
        for tid in stale:
            del self._active_tracks[tid]

        return len(self._active_tracks)

    def _update_with_smoothing(
        self, detections: List[Dict[str, Any]]
    ) -> int:
        """
        Rolling-average smoothing when no track IDs are available.
        Returns the rounded average of the last N frame counts.
        """
        self._count_history.append(len(detections))
        if not self._count_history:
            return 0
        return round(sum(self._count_history) / len(self._count_history))

