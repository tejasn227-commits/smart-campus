"""
database.py
-----------
SQLite database layer for the Classroom Occupancy Detector.

Responsibilities:
  - Create / migrate the occupancy_records table on first run.
  - Insert periodic occupancy snapshots.
  - Query history records for the dashboard.
"""

import sqlite3
import os
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

from config import DATABASE_PATH, DATABASE_DIR

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Schema
# ─────────────────────────────────────────────────────────────────────────────

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS occupancy_records (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    date                TEXT    NOT NULL,
    time                TEXT    NOT NULL,
    classroom           TEXT    NOT NULL,
    capacity            INTEGER NOT NULL,
    people_detected     INTEGER NOT NULL,
    available_seats     INTEGER NOT NULL,
    occupancy_percentage REAL   NOT NULL,
    status              TEXT    NOT NULL,
    created_at          TEXT    NOT NULL
);
"""

CREATE_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_classroom_date
ON occupancy_records (classroom, date);
"""


# ─────────────────────────────────────────────────────────────────────────────
# DatabaseManager
# ─────────────────────────────────────────────────────────────────────────────

class DatabaseManager:
    """Thread-safe SQLite wrapper for occupancy records."""

    def __init__(self, db_path: str = DATABASE_PATH):
        self.db_path = db_path
        self._ensure_directory()
        self._init_db()

    # ── Private helpers ───────────────────────────────────────────────────────

    def _ensure_directory(self) -> None:
        """Create the database directory if it doesn't exist."""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

    def _get_connection(self) -> sqlite3.Connection:
        """Return a new SQLite connection with row factory enabled."""
        conn = sqlite3.connect(self.db_path, timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")   # Better concurrency
        return conn

    def _init_db(self) -> None:
        """Create tables and indexes on first run."""
        try:
            with self._get_connection() as conn:
                conn.execute(CREATE_TABLE_SQL)
                conn.execute(CREATE_INDEX_SQL)
                conn.commit()
            logger.info("Database initialised at %s", self.db_path)
        except sqlite3.Error as exc:
            logger.error("Failed to initialise database: %s", exc)
            raise

    # ── Public API ────────────────────────────────────────────────────────────

    def insert_record(
        self,
        classroom: str,
        capacity: int,
        people_detected: int,
        available_seats: int,
        occupancy_percentage: float,
        status: str,
    ) -> bool:
        """
        Insert a single occupancy snapshot.

        Returns True on success, False on failure.
        """
        now = datetime.now()
        record = {
            "date": now.strftime("%Y-%m-%d"),
            "time": now.strftime("%H:%M:%S"),
            "classroom": classroom,
            "capacity": capacity,
            "people_detected": people_detected,
            "available_seats": available_seats,
            "occupancy_percentage": round(occupancy_percentage, 2),
            "status": status,
            "created_at": now.isoformat(),
        }
        sql = """
            INSERT INTO occupancy_records
                (date, time, classroom, capacity, people_detected,
                 available_seats, occupancy_percentage, status, created_at)
            VALUES
                (:date, :time, :classroom, :capacity, :people_detected,
                 :available_seats, :occupancy_percentage, :status, :created_at)
        """
        try:
            with self._get_connection() as conn:
                conn.execute(sql, record)
                conn.commit()
            return True
        except sqlite3.Error as exc:
            logger.error("Failed to insert record: %s", exc)
            return False

    def get_recent_records(
        self,
        classroom: Optional[str] = None,
        limit: int = 200,
    ) -> List[Dict[str, Any]]:
        """
        Fetch the most recent occupancy records.

        If `classroom` is given, filter by that classroom.
        """
        sql = """
            SELECT * FROM occupancy_records
            {where}
            ORDER BY id DESC
            LIMIT :limit
        """
        params: Dict[str, Any] = {"limit": limit}
        where_clause = ""
        if classroom:
            where_clause = "WHERE classroom = :classroom"
            params["classroom"] = classroom

        sql = sql.format(where=where_clause)
        try:
            with self._get_connection() as conn:
                rows = conn.execute(sql, params).fetchall()
            # Convert to list of plain dicts (newest-last for charting)
            return [dict(row) for row in reversed(rows)]
        except sqlite3.Error as exc:
            logger.error("Failed to fetch records: %s", exc)
            return []

    def get_today_records(self, classroom: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch all records for today."""
        today = datetime.now().strftime("%Y-%m-%d")
        sql = """
            SELECT * FROM occupancy_records
            WHERE date = :date
            {extra}
            ORDER BY id ASC
        """
        params: Dict[str, Any] = {"date": today}
        extra = ""
        if classroom:
            extra = "AND classroom = :classroom"
            params["classroom"] = classroom

        sql = sql.format(extra=extra)
        try:
            with self._get_connection() as conn:
                rows = conn.execute(sql, params).fetchall()
            return [dict(row) for row in rows]
        except sqlite3.Error as exc:
            logger.error("Failed to fetch today records: %s", exc)
            return []

    def get_classrooms(self) -> List[str]:
        """Return a distinct list of classroom names in the database."""
        try:
            with self._get_connection() as conn:
                rows = conn.execute(
                    "SELECT DISTINCT classroom FROM occupancy_records ORDER BY classroom"
                ).fetchall()
            return [row[0] for row in rows]
        except sqlite3.Error as exc:
            logger.error("Failed to fetch classrooms: %s", exc)
            return []

    def clear_records(self, classroom: Optional[str] = None) -> bool:
        """Delete records, optionally filtered by classroom."""
        sql = "DELETE FROM occupancy_records"
        params: Dict[str, Any] = {}
        if classroom:
            sql += " WHERE classroom = :classroom"
            params["classroom"] = classroom
        try:
            with self._get_connection() as conn:
                conn.execute(sql, params)
                conn.commit()
            return True
        except sqlite3.Error as exc:
            logger.error("Failed to clear records: %s", exc)
            return False

