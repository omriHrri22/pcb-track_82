from __future__ import annotations

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


UserRole = Literal["Designer", "Reviewer"]


class Task(BaseModel):
    name: str
    designerApproved: bool
    reviewerApproved: bool
    required: Optional[bool] = None
    url: Optional[str] = None
    comments: Optional[str] = None


class Subcategory(BaseModel):
    name: str
    designerApproved: Optional[bool] = None
    reviewerApproved: Optional[bool] = None
    tasks: List[Task] = Field(default_factory=list)


class Stage(BaseModel):
    name: str
    tasks: Optional[List[Task]] = None
    subcategories: Optional[List[Subcategory]] = None


class PCBBoard(BaseModel):
    id: str
    boardName: str
    partNumber: str
    revision: str
    project: str
    arrivedDate: str = ""          # frontend uses string (YYYY-MM-DD) or ""
    isArrived: bool = False
    passFailStatus: Optional[Literal["Pass", "Fail"]] = None
    isNewRevision: bool = False
    stages: List[Stage] = Field(default_factory=list)
    createdAt: str
    isDeleted: Optional[bool] = False
    deletedAt: Optional[str] = None


class CreateBoardRequest(BaseModel):
    boardName: str
    partNumber: str
    revision: str
    project: str
    isNewRevision: bool = False


class ChangeLogEntry(BaseModel):
    id: str
    timestamp: str
    userRole: UserRole
    userName: Optional[str] = None
    boardId: str
    boardName: str
    revision: str
    stage: str
    task: str
    field: str
    oldValue: str
    newValue: str


class CreateChangeLogRequest(BaseModel):
    userRole: UserRole
    userName: Optional[str] = None
    boardId: str
    boardName: str
    revision: str
    stage: str
    task: str
    field: str
    oldValue: str
    newValue: str


class CreateUserRequest(BaseModel):
    name: str
