from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import List, Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from db import db, init_db, row_to_board_dict, row_to_changelog_dict
from models import (
    PCBBoard,
    CreateBoardRequest,
    ChangeLogEntry,
    CreateChangeLogRequest,
    CreateUserRequest,
    Stage,
    Task,
    Subcategory,
)

app = FastAPI(title="PCB Track Backend", version="1.0.0")

# Dev-friendly CORS (adjust later if you deploy)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

# Stage templates extracted from your types.ts (names: Pre-Schematics, Schematics, etc.)
STAGE_TEMPLATES = [
    {
        "name": "Pre-Schematics",
        "tasks": [
            "Requirements Available",
            "EQ Review (Previous revision)",
            "Bringup notes (Previous revision)",
            "Mechanical notes (Previous revision)",
            "Comments 365 (Previous revision)",
            "Block Diagram Updated",
            "Power Tree Updated",
            "Shielding",
            "PDR Completed",
        ],
    },
    {
        "name": "Schematics",
        "tasks": [
            "Schematic design",
            "Test points",
            "GND hooks",
            "Shielding",
            "Parts in BOM",
        ],
    },
    {
        "name": "Layout",
        "tasks": [
            "Define Rules",
            "Define Stackup",
            "Get DXF",
            "Concept Placement",
            "First Mechanical Approval",
            "Placement",
            "Second Mechanical Approval",
            "Wiring",
            "Impedance control done?",
            "Length matching done?",
            "Filling and capping vias sets?",
            "TEAR DROPS optional done?",
            "Backdrill done?",
            "STITCHING and shielding? (if need)",
            "Check BOARD outline (5mil) layers",
            "Check Assembly layer",
            "Silk overview [name connectors(pins?), part number, serial number]",
            "Final Mechanical Approval",
        ],
    },
    {
        "name": "Release",
        "tasks": [
            "Update Issues Excel",
            "Issues Excel Review",
            "Draftsman",
            "Confluence – Main Page",
            "Confluence – Bringup",
            "Software fetchers doc",
        ],
    },
    {
        "name": "Order",
        "tasks": [
            "PCB Ordered",
            "PCB Received",
            "Assembly Ordered",
            "Assembly Received",
        ],
    },
    {
        "name": "Bringup",
        "tasks": [
            "Bringup Started",
            "Bringup Completed",
            "Bringup Notes Updated",
        ],
    },
    {
        "name": "Validation",
        "tasks": [
            "Bringup Completed",
            "Board outline",
            "BOM components stage",
            "Planes",
        ],
    },
    {
        "name": "In Production",
        "subcategories": [
            {
                "name": "Mechanical",
                "tasks": [
                    "Mechanical Integration Complete",
                    "Mechanical Testing Passed",
                    "Mechanical Sign-Off",
                ],
            },
            {
                "name": "Embedded",
                "tasks": [
                    "Firmware Loaded",
                    "Embedded Testing Complete",
                    "Embedded Sign-Off",
                ],
            },
            {
                "name": "Software",
                "tasks": [
                    "Software Integration Complete",
                    "Software Testing Passed",
                    "Software Sign-Off",
                ],
            },
            {
                "name": "System",
                "tasks": [
                    "System Integration Complete",
                    "System Testing Passed",
                    "System Sign-Off",
                ],
            },
        ],
    },
]

def build_default_stages() -> list[dict]:
    stages: list[dict] = []
    for st in STAGE_TEMPLATES:
        stage = {"name": st["name"]}
        if "tasks" in st:
            stage["tasks"] = [
                {"name": t, "designerApproved": False, "reviewerApproved": False}
                for t in st["tasks"]
            ]
        if "subcategories" in st:
            stage["subcategories"] = [
                {
                    "name": sc["name"],
                    "designerApproved": False,
                    "reviewerApproved": False,
                    "tasks": [
                        {"name": t, "designerApproved": False, "reviewerApproved": False}
                        for t in sc["tasks"]
                    ],
                }
                for sc in st["subcategories"]
            ]
        stages.append(stage)
    return stages


@app.on_event("startup")
def _startup() -> None:
    init_db()


# -----------------------
# Boards
# -----------------------
@app.get("/api/boards", response_model=List[PCBBoard])
def list_boards(includeDeleted: bool = Query(False)) -> List[PCBBoard]:
    with db() as conn:
        if includeDeleted:
            rows = conn.execute("SELECT * FROM boards ORDER BY created_at DESC").fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM boards WHERE is_deleted=0 ORDER BY created_at DESC"
            ).fetchall()
    return [PCBBoard(**row_to_board_dict(r)) for r in rows]


@app.get("/api/boards/{board_id}", response_model=PCBBoard)
def get_board(board_id: str) -> PCBBoard:
    with db() as conn:
        r = conn.execute("SELECT * FROM boards WHERE id=?", (board_id,)).fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="Board not found")
    return PCBBoard(**row_to_board_dict(r))


@app.post("/api/boards", response_model=PCBBoard)
def create_board(req: CreateBoardRequest) -> PCBBoard:
    board_id = str(uuid4())
    ts = now_iso()

    board_dict = {
        "id": board_id,
        "boardName": req.boardName,
        "partNumber": req.partNumber,
        "revision": req.revision,
        "project": req.project,
        "arrivedDate": "",
        "isArrived": False,
        "passFailStatus": None,
        "isNewRevision": req.isNewRevision,
        "stages": build_default_stages(),
        "createdAt": ts,
        "isDeleted": False,
        "deletedAt": None,
    }

    with db() as conn:
        conn.execute(
            """
            INSERT INTO boards (
              id, board_name, part_number, revision, project,
              is_new_revision, arrived_date, is_arrived, pass_fail_status,
              stages_json, created_at, updated_at, is_deleted, deleted_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                board_id,
                req.boardName,
                req.partNumber,
                req.revision,
                req.project,
                1 if req.isNewRevision else 0,
                "",
                0,
                None,
                json.dumps(board_dict["stages"]),
                ts,
                ts,
                0,
                None,
            ),
        )

    return PCBBoard(**board_dict)


@app.put("/api/boards/{board_id}", response_model=PCBBoard)
def update_board(board_id: str, board: PCBBoard) -> PCBBoard:
    # Ensure path id is source-of-truth
    if board.id != board_id:
        raise HTTPException(status_code=400, detail="Board ID mismatch")

    # Make sure board exists
    with db() as conn:
        existing = conn.execute("SELECT id FROM boards WHERE id=?", (board_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Board not found")

        updated_at = now_iso()

        conn.execute(
            """
            UPDATE boards
            SET
              board_name=?,
              part_number=?,
              revision=?,
              project=?,
              is_new_revision=?,
              arrived_date=?,
              is_arrived=?,
              pass_fail_status=?,
              stages_json=?,
              updated_at=?,
              is_deleted=?,
              deleted_at=?
            WHERE id=?
            """,
            (
                board.boardName,
                board.partNumber,
                board.revision,
                board.project,
                1 if board.isNewRevision else 0,
                board.arrivedDate or "",
                1 if board.isArrived else 0,
                board.passFailStatus,
                json.dumps([s.model_dump() for s in board.stages]),
                updated_at,
                1 if (board.isDeleted or False) else 0,
                board.deletedAt,
                board_id,
            ),
        )

    return board


@app.post("/api/boards/{board_id}/delete", response_model=PCBBoard)
def soft_delete_board(board_id: str) -> PCBBoard:
    with db() as conn:
        r = conn.execute("SELECT * FROM boards WHERE id=?", (board_id,)).fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Board not found")
        deleted_at = now_iso()
        conn.execute(
            "UPDATE boards SET is_deleted=1, deleted_at=?, updated_at=? WHERE id=?",
            (deleted_at, deleted_at, board_id),
        )
        r2 = conn.execute("SELECT * FROM boards WHERE id=?", (board_id,)).fetchone()
    return PCBBoard(**row_to_board_dict(r2))


@app.post("/api/boards/{board_id}/restore", response_model=PCBBoard)
def restore_board(board_id: str) -> PCBBoard:
    with db() as conn:
        r = conn.execute("SELECT * FROM boards WHERE id=?", (board_id,)).fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Board not found")
        ts = now_iso()
        conn.execute(
            "UPDATE boards SET is_deleted=0, deleted_at=NULL, updated_at=? WHERE id=?",
            (ts, board_id),
        )
        r2 = conn.execute("SELECT * FROM boards WHERE id=?", (board_id,)).fetchone()
    return PCBBoard(**row_to_board_dict(r2))


@app.delete("/api/boards/{board_id}")
def permanent_delete_board(board_id: str) -> dict:
    with db() as conn:
        r = conn.execute("SELECT id FROM boards WHERE id=?", (board_id,)).fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Board not found")
        conn.execute("DELETE FROM boards WHERE id=?", (board_id,))
        # optionally delete changelog entries too:
        conn.execute("DELETE FROM change_log WHERE board_id=?", (board_id,))
    return {"ok": True}


# -----------------------
# Change log
# -----------------------
@app.get("/api/changelog", response_model=List[ChangeLogEntry])
def get_changelog(boardId: Optional[str] = None) -> List[ChangeLogEntry]:
    with db() as conn:
        if boardId:
            rows = conn.execute(
                "SELECT * FROM change_log WHERE board_id=? ORDER BY timestamp DESC",
                (boardId,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM change_log ORDER BY timestamp DESC"
            ).fetchall()

    return [ChangeLogEntry(**row_to_changelog_dict(r)) for r in rows]


@app.post("/api/changelog", response_model=ChangeLogEntry)
def add_changelog(req: CreateChangeLogRequest) -> ChangeLogEntry:
    entry_id = str(uuid4())
    ts = now_iso()
    entry = {
        "id": entry_id,
        "timestamp": ts,
        "userRole": req.userRole,
        "userName": req.userName,
        "boardId": req.boardId,
        "boardName": req.boardName,
        "revision": req.revision,
        "stage": req.stage,
        "task": req.task,
        "field": req.field,
        "oldValue": req.oldValue,
        "newValue": req.newValue,
    }

    with db() as conn:
        conn.execute(
            """
            INSERT INTO change_log (
              id, timestamp, user_role, user_name, board_id, board_name, revision,
              stage, task, field, old_value, new_value
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                entry_id,
                ts,
                req.userRole,
                req.userName,
                req.boardId,
                req.boardName,
                req.revision,
                req.stage,
                req.task,
                req.field,
                req.oldValue,
                req.newValue,
            ),
        )

    return ChangeLogEntry(**entry)


# -----------------------
# Users
# -----------------------
@app.get("/api/users", response_model=List[str])
def list_users() -> List[str]:
    with db() as conn:
        rows = conn.execute("SELECT name FROM users ORDER BY name ASC").fetchall()
    return [r["name"] for r in rows]


@app.post("/api/users", response_model=List[str])
def add_user(req: CreateUserRequest) -> List[str]:
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    with db() as conn:
        conn.execute("INSERT OR IGNORE INTO users(name) VALUES (?)", (name,))
        rows = conn.execute("SELECT name FROM users ORDER BY name ASC").fetchall()
    return [r["name"] for r in rows]


@app.delete("/api/users/{name}", response_model=List[str])
def remove_user(name: str) -> List[str]:
    with db() as conn:
        conn.execute("DELETE FROM users WHERE name=?", (name,))
        rows = conn.execute("SELECT name FROM users ORDER BY name ASC").fetchall()
    return [r["name"] for r in rows]
