from typing import Any
from pydantic import BaseModel


class IngestRequest(BaseModel):
    source: str
    log_text: str
    severity_hint: str | None = None
    metadata: dict[str, Any] | None = None


class IncidentStatusUpdateRequest(BaseModel):
    status: str


class IncidentNoteCreateRequest(BaseModel):
    note: str
    author: str | None = None


class FeedbackRequest(BaseModel):
    incident_id: int
    worked: bool
    actual_fix: str | None = None


class IncidentAssignRequest(BaseModel):
    assignee: str


class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str