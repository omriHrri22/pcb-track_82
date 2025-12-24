from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from typing import Any, Dict, List, Optional

DB_PATH = os.getenv("PCB_TRACK_DB", "pcb_track.db")


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS boards (
              id TEXT PRIMARY KEY,
              board_name TEXT NOT NULL,
              part_number TEXT NOT NULL,
              revision TEXT NOT NULL,
              project TEXT NOT NULL,
              is_new_revision INTEGER NOT NULL,
              arrived_date TEXT NOT NULL,
              is_arrived INTEGER NOT NULL,
              pass_fail_status TEXT,
              stages_json TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              is_deleted INTEGER NOT NULL,
              deleted_at TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS change_log (
              id TEXT PRIMARY KEY,
              timestamp TEXT NOT NULL,
              user_role TEXT NOT NULL,
              user_name TEXT,
              board_id TEXT NOT NULL,
              board_name TEXT NOT NULL,
              revision TEXT NOT NULL,
              stage TEXT NOT NULL,
              task TEXT NOT NULL,
              field TEXT NOT NULL,
              old_value TEXT NOT NULL,
              new_value TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
              name TEXT PRIMARY KEY
            )
            """
        )
        conn.commit()


@contextmanager
def db() -> sqlite3.Connection:
    conn = _connect()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def row_to_board_dict(r: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": r["id"],
        "boardName": r["board_name"],
        "partNumber": r["part_number"],
        "revision": r["revision"],
        "project": r["project"],
        "isNewRevision": bool(r["is_new_revision"]),
        "arrivedDate": r["arrived_date"] or "",
        "isArrived": bool(r["is_arrived"]),
        "passFailStatus": r["pass_fail_status"],
        "stages": json.loads(r["stages_json"]) if r["stages_json"] else [],
        "createdAt": r["created_at"],
        "isDeleted": bool(r["is_deleted"]),
        "deletedAt": r["deleted_at"],
        # updated_at is stored but frontend doesn't require it; keep it if you want later
    }


def row_to_changelog_dict(r: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": r["id"],
        "timestamp": r["timestamp"],
        "userRole": r["user_role"],
        "userName": r["user_name"],
        "boardId": r["board_id"],
        "boardName": r["board_name"],
        "revision": r["revision"],
        "stage": r["stage"],
        "task": r["task"],
        "field": r["field"],
        "oldValue": r["old_value"],
        "newValue": r["new_value"],
    }
