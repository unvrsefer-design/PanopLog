import json
import time

from fastapi import APIRouter, Header

from db import (
    get_db,
    execute,
    fetchall_dict,
    fetchone_dict,
    insert_and_get_id,
)
from schemas import (
    IngestRequest,
    IncidentStatusUpdateRequest,
    IncidentNoteCreateRequest,
    IncidentAssignRequest,
)
from ai_service import analyze_log_with_ai
from services.policy_service import build_source_policy, should_notify
from services.learning_service import apply_learned_fix
from services.dedup_service import fingerprint, find_semantic_match
from services.notification_service import (
    build_new_incident_message,
    build_incident_update_message,
    notify_all,
)
from services.event_service import add_event
from services.query_service import (
    get_notes_for_incident,
    get_events_for_incident,
)
from services.auth_service import get_current_user_from_authorization
from services.realtime_service import publish_event

router = APIRouter()

ALLOWED_STATUSES = {"open", "acknowledged", "resolved", "ignored"}


@router.post("/ingest")
async def ingest(payload: IngestRequest, authorization: str | None = Header(default=None)):
    current_user = get_current_user_from_authorization(authorization)
    actor = current_user["username"] if current_user else "anonymous"

    now = int(time.time())
    analysis = analyze_log_with_ai(payload.log_text)
    analysis, used_learned_fix, learned_fix = apply_learned_fix(analysis)

    policy = build_source_policy(
        payload.source,
        analysis["severity"],
        analysis["component"],
    )

    fp = fingerprint(payload.source, analysis["component"], analysis["short_title"])

    conn = get_db()
    cur = conn.cursor()

    execute(
        cur,
        """
        SELECT *
        FROM incidents
        WHERE fingerprint = ? AND status IN ('open','acknowledged')
        LIMIT 1
        """,
        (fp,),
    )
    existing = fetchone_dict(cur)

    semantic_existing = None
    semantic_score = 0.0

    if not existing:
        semantic_existing, semantic_score = find_semantic_match(
            payload.source,
            analysis["component"],
            analysis["summary"],
        )

    if existing or (semantic_existing and semantic_score >= 0.55):
        target = existing if existing else semantic_existing

        execute(
            cur,
            """
            UPDATE incidents
            SET
                occurrence_count = occurrence_count + 1,
                last_seen_at = ?,
                summary = ?,
                severity = ?,
                possible_cause = ?,
                first_action = ?,
                likely_fix = ?,
                verification_step = ?,
                risk_note = ?,
                highlighted_lines = ?,
                context_blocks = ?,
                runbook_steps = ?,
                source_policy = ?,
                similarity_group = ?,
                similarity_score = ?,
                used_learned_fix = ?
            WHERE id = ?
            """,
            (
                now,
                analysis["summary"],
                analysis["severity"],
                analysis["possible_cause"],
                analysis["first_action"],
                analysis["likely_fix"],
                analysis["verification_step"],
                analysis["risk_note"],
                json.dumps(analysis["highlighted_lines"], ensure_ascii=False),
                json.dumps(analysis["context_blocks"], ensure_ascii=False),
                json.dumps(analysis["runbook_steps"], ensure_ascii=False),
                json.dumps(policy, ensure_ascii=False),
                fp,
                semantic_score if not existing else 1.0,
                1 if used_learned_fix else 0,
                target["id"],
            ),
        )

        conn.commit()
        conn.close()

        add_event(
            target["id"],
            "dedup_hit",
            {
                "source": payload.source,
                "severity": analysis["severity"],
                "occurrence_increment": 1,
                "mode": "fingerprint" if existing else "semantic",
                "similarity_score": semantic_score if not existing else 1.0,
                "used_learned_fix": used_learned_fix,
                "actor": actor,
            },
        )

        if used_learned_fix:
            add_event(
                target["id"],
                "learned_fix_applied",
                {
                    "component": analysis["component"],
                    "source": payload.source,
                    "actual_fix": learned_fix,
                    "actor": actor,
                },
            )

        if should_notify(payload.source, analysis["severity"]):
            msg = build_incident_update_message(analysis, payload.source, policy)
            notify_all(msg, analysis=analysis, source=payload.source)

        print(f"[RT] publish incident_updated dedup_hit incident_id={target['id']}")
        await publish_event(
            "incident_updated",
            {
                "incident_id": target["id"],
                "action": "dedup_hit",
                "actor": actor,
            },
        )

        return {
            "success": True,
            "incident_id": target["id"],
            "deduped": True,
            "actor": actor,
        }

    incident_id = insert_and_get_id(
        cur,
        """
        INSERT INTO incidents (
            source, short_title, severity, component, summary,
            possible_cause, first_action, likely_fix,
            verification_step, risk_note,
            highlighted_lines, context_blocks, runbook_steps,
            fingerprint, occurrence_count, status,
            created_at, last_seen_at, worked, actual_fix, assignee,
            source_policy, similarity_group, similarity_score, used_learned_fix
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.source,
            analysis["short_title"],
            analysis["severity"],
            analysis["component"],
            analysis["summary"],
            analysis["possible_cause"],
            analysis["first_action"],
            analysis["likely_fix"],
            analysis["verification_step"],
            analysis["risk_note"],
            json.dumps(analysis["highlighted_lines"], ensure_ascii=False),
            json.dumps(analysis["context_blocks"], ensure_ascii=False),
            json.dumps(analysis["runbook_steps"], ensure_ascii=False),
            fp,
            1,
            "open",
            now,
            now,
            None,
            "",
            "",
            json.dumps(policy, ensure_ascii=False),
            fp,
            1.0,
            1 if used_learned_fix else 0,
        ),
    )

    conn.commit()
    conn.close()

    add_event(
        incident_id,
        "created",
        {
            "source": payload.source,
            "severity": analysis["severity"],
            "component": analysis["component"],
            "environment": policy["environment"],
            "route_target": policy["route_target"],
            "actor": actor,
        },
    )

    if used_learned_fix:
        add_event(
            incident_id,
            "learned_fix_applied",
            {
                "component": analysis["component"],
                "source": payload.source,
                "actual_fix": learned_fix,
                "actor": actor,
            },
        )

    if should_notify(payload.source, analysis["severity"]):
        msg = build_new_incident_message(analysis, payload.source, policy)
        notify_all(msg, analysis=analysis, source=payload.source)

    print(f"[RT] publish incident_created incident_id={incident_id}")
    await publish_event(
        "incident_created",
        {
            "incident_id": incident_id,
            "actor": actor,
        },
    )

    return {"success": True, "incident_id": incident_id, "actor": actor}


@router.get("/incidents")
def incidents():
    conn = get_db()
    cur = conn.cursor()

    execute(
        cur,
        """
        SELECT * FROM incidents
        ORDER BY last_seen_at DESC
        """
    )

    rows = fetchall_dict(cur)
    result = []

    for r in rows:
        result.append(
            {
                "db_id": r["id"],
                "source": r["source"],
                "short_title": r["short_title"],
                "severity": r["severity"],
                "component": r["component"],
                "summary": r["summary"],
                "possible_cause": r["possible_cause"],
                "first_action": r["first_action"],
                "likely_fix": r["likely_fix"],
                "verification_step": r["verification_step"],
                "risk_note": r["risk_note"],
                "highlighted_lines": json.loads(r["highlighted_lines"]) if r.get("highlighted_lines") else [],
                "context_blocks": json.loads(r["context_blocks"]) if r.get("context_blocks") else [],
                "runbook_steps": json.loads(r["runbook_steps"]) if r.get("runbook_steps") else [],
                "status": r["status"],
                "occurrence_count": r["occurrence_count"],
                "created_at": r["created_at"],
                "last_seen_at": r["last_seen_at"],
                "worked": None if r["worked"] is None else bool(r["worked"]),
                "actual_fix": r["actual_fix"] or "",
                "assignee": r["assignee"] or "",
                "source_policy": json.loads(r["source_policy"]) if r.get("source_policy") else {},
                "similarity_group": r["similarity_group"] or "",
                "similarity_score": r["similarity_score"] or 0,
                "used_learned_fix": bool(r["used_learned_fix"]) if r["used_learned_fix"] is not None else False,
                "notes": get_notes_for_incident(r["id"]),
                "events": get_events_for_incident(r["id"]),
            }
        )

    conn.close()
    return {"success": True, "items": result}


@router.patch("/incidents/{incident_id}/status")
async def status(
    incident_id: int,
    body: IncidentStatusUpdateRequest,
    authorization: str | None = Header(default=None),
):
    if body.status not in ALLOWED_STATUSES:
        return {"success": False, "error": "Invalid status"}

    current_user = get_current_user_from_authorization(authorization)
    actor = current_user["username"] if current_user else "anonymous"

    conn = get_db()
    cur = conn.cursor()

    execute(
        cur,
        """
        UPDATE incidents
        SET status = ?
        WHERE id = ?
        """,
        (body.status, incident_id),
    )

    conn.commit()
    conn.close()

    add_event(
        incident_id,
        "status_changed",
        {
            "status": body.status,
            "actor": actor,
        },
    )

    print(f"[RT] publish incident_updated status_changed incident_id={incident_id} status={body.status}")
    await publish_event(
        "incident_updated",
        {
            "incident_id": incident_id,
            "action": "status_changed",
            "actor": actor,
            "status": body.status,
        },
    )

    return {"success": True, "actor": actor}


@router.patch("/incidents/{incident_id}/assign")
async def assign_incident(
    incident_id: int,
    payload: IncidentAssignRequest,
    authorization: str | None = Header(default=None),
):
    current_user = get_current_user_from_authorization(authorization)
    actor = current_user["username"] if current_user else "anonymous"

    assignee = payload.assignee.strip()

    conn = get_db()
    cur = conn.cursor()

    execute(
        cur,
        """
        UPDATE incidents
        SET assignee = ?
        WHERE id = ?
        """,
        (assignee, incident_id),
    )

    conn.commit()
    conn.close()

    add_event(
        incident_id,
        "assigned",
        {
            "assignee": assignee,
            "actor": actor,
        },
    )

    print(f"[RT] publish incident_updated assigned incident_id={incident_id} assignee={assignee}")
    await publish_event(
        "incident_updated",
        {
            "incident_id": incident_id,
            "action": "assigned",
            "actor": actor,
            "assignee": assignee,
        },
    )

    return {"success": True, "incident_id": incident_id, "assignee": assignee, "actor": actor}


@router.post("/incidents/{incident_id}/notes")
async def note(
    incident_id: int,
    body: IncidentNoteCreateRequest,
    authorization: str | None = Header(default=None),
):
    now = int(time.time())

    current_user = get_current_user_from_authorization(authorization)
    actor = current_user["username"] if current_user else (body.author or "anonymous")

    conn = get_db()
    cur = conn.cursor()

    insert_and_get_id(
        cur,
        """
        INSERT INTO incident_notes (incident_id, note, author, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (incident_id, body.note, actor, now),
    )

    conn.commit()
    conn.close()

    add_event(
        incident_id,
        "note_added",
        {
            "note": body.note,
            "actor": actor,
        },
    )

    print(f"[RT] publish incident_updated note_added incident_id={incident_id}")
    await publish_event(
        "incident_updated",
        {
            "incident_id": incident_id,
            "action": "note_added",
            "actor": actor,
        },
    )

    return {"success": True, "author": actor}