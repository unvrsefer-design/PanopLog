import json
import time

from db import get_db, execute, insert_and_get_id


def add_event(incident_id: int, event_type: str, data: dict):
    conn = get_db()
    cur = conn.cursor()

    insert_and_get_id(
        cur,
        """
        INSERT INTO incident_events (incident_id, type, data, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (
            incident_id,
            event_type,
            json.dumps(data, ensure_ascii=False),
            int(time.time()),
        ),
    )

    conn.commit()
    conn.close()