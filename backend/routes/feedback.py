from fastapi import APIRouter, Header

from db import get_db, execute
from schemas import FeedbackRequest
from services.event_service import add_event
from services.auth_service import get_current_user_from_authorization
from services.realtime_service import publish_event

router = APIRouter()


@router.post("/feedback")
async def feedback(body: FeedbackRequest, authorization: str | None = Header(default=None)):
    current_user = get_current_user_from_authorization(authorization)
    actor = current_user["username"] if current_user else "anonymous"

    conn = get_db()
    cur = conn.cursor()

    execute(
        cur,
        """
        UPDATE incidents
        SET worked = ?, actual_fix = ?
        WHERE id = ?
        """,
        (
            1 if body.worked else 0,
            body.actual_fix,
            body.incident_id,
        ),
    )

    conn.commit()
    conn.close()

    add_event(
        body.incident_id,
        "feedback",
        {
            "worked": body.worked,
            "actual_fix": body.actual_fix or "",
            "actor": actor,
        },
    )

    await publish_event(
        "incident_updated",
        {
            "incident_id": body.incident_id,
            "action": "feedback",
            "actor": actor,
        },
    )

    return {"success": True, "actor": actor}