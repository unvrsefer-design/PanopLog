import json

from db import get_db, execute, fetchall_dict


def get_notes_for_incident(incident_id: int):
    conn = get_db()
    cur = conn.cursor()

    execute(
        cur,
        """
        SELECT * FROM incident_notes
        WHERE incident_id = ?
        ORDER BY created_at DESC
        """,
        (incident_id,),
    )

    rows = fetchall_dict(cur)
    conn.close()
    return rows


def get_events_for_incident(incident_id: int):
    conn = get_db()
    cur = conn.cursor()

    execute(
        cur,
        """
        SELECT * FROM incident_events
        WHERE incident_id = ?
        ORDER BY created_at DESC
        """,
        (incident_id,),
    )

    rows = fetchall_dict(cur)
    conn.close()

    result = []
    for r in rows:
        result.append(
            {
                "id": r["id"],
                "incident_id": r["incident_id"],
                "type": r["type"],
                "data": json.loads(r["data"]) if r.get("data") else {},
                "created_at": r["created_at"],
            }
        )

    return result