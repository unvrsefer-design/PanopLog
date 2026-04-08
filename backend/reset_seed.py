import sqlite3
import time
import json

DB_PATH = "panoplog.db"


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Keep users/auth data, clear incident-related data only
    cur.execute("DELETE FROM incident_notes")
    cur.execute("DELETE FROM incident_events")
    cur.execute("DELETE FROM incidents")

    now = int(time.time())

    incidents = [
        {
            "source": "redis-prod-01",
            "short_title": "Redis Connection Failure",
            "severity": "critical",
            "component": "redis",
            "summary": "Connection to the Redis server failed and timed out.",
            "possible_cause": "The Redis instance may be unreachable due to network issues or service instability.",
            "first_action": "Check Redis health and verify network connectivity from the application.",
            "verification_step": "Confirm whether new timeout errors stop appearing after Redis recovers.",
            "likely_fix": "Restart the Redis instance if unhealthy and verify client connection settings and network access.",
            "risk_note": "Unresolved Redis failures may break caching, sessions, or request processing.",
            "status": "open",
            "occurrence_count": 3,
            "assignee": "",
            "worked": None,
            "actual_fix": "",
            "used_learned_fix": 0,
        },
        {
            "source": "orders-api",
            "short_title": "Rate Limit Exceeded",
            "severity": "medium",
            "component": "api",
            "summary": "Too many requests were sent to the orders endpoint, causing rate limiting.",
            "possible_cause": "Traffic spikes or missing client-side throttling may be overloading the endpoint.",
            "first_action": "Inspect request volume and identify clients generating excessive traffic.",
            "verification_step": "Check whether request rates return to normal after mitigation.",
            "likely_fix": "Apply throttling, caching, or request batching to reduce pressure on the endpoint.",
            "risk_note": "If unresolved, users may continue to experience degraded API availability.",
            "status": "open",
            "occurrence_count": 1,
            "assignee": "",
            "worked": None,
            "actual_fix": "",
            "used_learned_fix": 0,
        },
        {
            "source": "db-cluster-01",
            "short_title": "Connection Pool Exhausted",
            "severity": "high",
            "component": "database",
            "summary": "The database connection pool limit has been reached, blocking new requests.",
            "possible_cause": "Long-running queries or insufficient pool sizing may be exhausting available connections.",
            "first_action": "Review active queries and connection usage in the database.",
            "verification_step": "Verify that pool usage drops and new requests succeed after intervention.",
            "likely_fix": "Optimize slow queries and adjust pool size if traffic consistently exceeds current capacity.",
            "risk_note": "If unresolved, application requests may fail or remain queued.",
            "status": "acknowledged",
            "occurrence_count": 2,
            "assignee": "alice",
            "worked": None,
            "actual_fix": "",
            "used_learned_fix": 0,
        },
        {
            "source": "payment-service",
            "short_title": "Payment Service Crash",
            "severity": "critical",
            "component": "payment-service",
            "summary": "The payment service crashed due to an unhandled runtime exception.",
            "possible_cause": "A null reference or invalid downstream response may be crashing the service.",
            "first_action": "Check crash logs and restart the payment service if necessary.",
            "verification_step": "Confirm that payment requests succeed and crash logs no longer appear.",
            "likely_fix": "Patch the exception path and add input validation or defensive error handling.",
            "risk_note": "If unresolved, payment processing may be unavailable for customers.",
            "status": "resolved",
            "occurrence_count": 1,
            "assignee": "sefer",
            "worked": 1,
            "actual_fix": "Added defensive null checks and redeployed the payment service.",
            "used_learned_fix": 1,
        },
    ]

    for item in incidents:
        fingerprint = f"{item['source']}::{item['component']}::{item['short_title']}".lower()

        cur.execute(
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
                item["source"],
                item["short_title"],
                item["severity"],
                item["component"],
                item["summary"],
                item["possible_cause"],
                item["first_action"],
                item["likely_fix"],
                item["verification_step"],
                item["risk_note"],
                json.dumps([], ensure_ascii=False),
                json.dumps([], ensure_ascii=False),
                json.dumps(
                    [
                        "Check service health",
                        "Inspect recent logs",
                        "Validate dependencies",
                        "Verify recovery",
                    ],
                    ensure_ascii=False,
                ),
                fingerprint,
                item["occurrence_count"],
                item["status"],
                now,
                now,
                item["worked"],
                item["actual_fix"],
                item["assignee"],
                json.dumps(
                    {
                        "environment": "production",
                        "route_target": "default",
                    },
                    ensure_ascii=False,
                ),
                fingerprint,
                1.0,
                item["used_learned_fix"],
            ),
        )

        incident_id = cur.lastrowid

        cur.execute(
            """
            INSERT INTO incident_events (incident_id, type, data, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                incident_id,
                "created",
                json.dumps({"actor": "seed"}, ensure_ascii=False),
                now,
            ),
        )

        if item["assignee"]:
            cur.execute(
                """
                INSERT INTO incident_events (incident_id, type, data, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (
                    incident_id,
                    "assigned",
                    json.dumps(
                        {"actor": "seed", "assignee": item["assignee"]},
                        ensure_ascii=False,
                    ),
                    now,
                ),
            )

        if item["actual_fix"]:
            cur.execute(
                """
                INSERT INTO incident_notes (incident_id, note, author, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (
                    incident_id,
                    item["actual_fix"],
                    "seed",
                    now,
                ),
            )

    conn.commit()
    conn.close()
    print("Incident data reset and English seed data inserted successfully.")


if __name__ == "__main__":
    main()