import os
import sqlite3

import psycopg2

DB_PATH = os.path.join(os.path.dirname(__file__), "panoplog.db")
DATABASE_URL = os.getenv("DATABASE_URL")


def is_postgres() -> bool:
    return bool(DATABASE_URL and DATABASE_URL.startswith("postgres"))


def get_db():
    if is_postgres():
        return psycopg2.connect(DATABASE_URL)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def sql(q: str) -> str:
    """
    SQLite '?' placeholder kullanan query'yi PostgreSQL '%s' formatına çevirir.
    """
    if is_postgres():
        return q.replace("?", "%s")
    return q


def fetchall_dict(cur):
    if not cur.description:
        return []

    columns = [desc[0] for desc in cur.description]
    rows = cur.fetchall()

    result = []
    for row in rows:
        result.append(dict(zip(columns, row)))
    return result


def fetchone_dict(cur):
    if not cur.description:
        return None

    row = cur.fetchone()
    if not row:
        return None

    columns = [desc[0] for desc in cur.description]
    return dict(zip(columns, row))


def execute(cur, query: str, params=()):
    return cur.execute(sql(query), params)


def insert_and_get_id(cur, query: str, params=()):
    if is_postgres():
        q = query.rstrip().rstrip(";")
        q = f"{sql(q)} RETURNING id"
        cur.execute(q, params)
        row = cur.fetchone()
        return row[0] if row else None

    cur.execute(query, params)
    return cur.lastrowid


def init_db():
    conn = get_db()
    cur = conn.cursor()

    if is_postgres():
        cur.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id SERIAL PRIMARY KEY,
            source TEXT,
            short_title TEXT,
            severity TEXT,
            component TEXT,
            summary TEXT,
            possible_cause TEXT,
            first_action TEXT,
            likely_fix TEXT,
            verification_step TEXT,
            risk_note TEXT,
            highlighted_lines TEXT,
            context_blocks TEXT,
            runbook_steps TEXT,
            fingerprint TEXT,
            occurrence_count INTEGER DEFAULT 1,
            status TEXT DEFAULT 'open',
            created_at BIGINT,
            last_seen_at BIGINT,
            worked INTEGER,
            actual_fix TEXT,
            assignee TEXT,
            source_policy TEXT,
            similarity_group TEXT,
            similarity_score DOUBLE PRECISION DEFAULT 0,
            used_learned_fix INTEGER DEFAULT 0
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS incident_notes (
            id SERIAL PRIMARY KEY,
            incident_id INTEGER,
            note TEXT,
            author TEXT,
            created_at BIGINT
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS incident_events (
            id SERIAL PRIMARY KEY,
            incident_id INTEGER,
            type TEXT,
            data TEXT,
            created_at BIGINT
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            created_at BIGINT
        )
        """)

        cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_incidents_fingerprint_status
        ON incidents (fingerprint, status)
        """)

        cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_incidents_source_component_status
        ON incidents (source, component, status)
        """)

        conn.commit()
        conn.close()
        return

    cur.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT,
        short_title TEXT,
        severity TEXT,
        component TEXT,
        summary TEXT,
        possible_cause TEXT,
        first_action TEXT,
        likely_fix TEXT,
        verification_step TEXT,
        risk_note TEXT,
        highlighted_lines TEXT,
        context_blocks TEXT,
        runbook_steps TEXT,
        fingerprint TEXT,
        occurrence_count INTEGER DEFAULT 1,
        status TEXT DEFAULT 'open',
        created_at INTEGER,
        last_seen_at INTEGER,
        worked INTEGER,
        actual_fix TEXT,
        assignee TEXT,
        source_policy TEXT,
        similarity_group TEXT,
        similarity_score REAL DEFAULT 0,
        used_learned_fix INTEGER DEFAULT 0
    )
    """)

    migrations = [
        "ALTER TABLE incidents ADD COLUMN status TEXT DEFAULT 'open'",
        "ALTER TABLE incidents ADD COLUMN fingerprint TEXT",
        "ALTER TABLE incidents ADD COLUMN occurrence_count INTEGER DEFAULT 1",
        "ALTER TABLE incidents ADD COLUMN last_seen_at INTEGER",
        "ALTER TABLE incidents ADD COLUMN worked INTEGER",
        "ALTER TABLE incidents ADD COLUMN actual_fix TEXT",
        "ALTER TABLE incidents ADD COLUMN assignee TEXT",
        "ALTER TABLE incidents ADD COLUMN source_policy TEXT",
        "ALTER TABLE incidents ADD COLUMN similarity_group TEXT",
        "ALTER TABLE incidents ADD COLUMN similarity_score REAL DEFAULT 0",
        "ALTER TABLE incidents ADD COLUMN used_learned_fix INTEGER DEFAULT 0",
    ]

    for statement in migrations:
        try:
            cur.execute(statement)
            conn.commit()
        except Exception:
            pass

    cur.execute("""
    CREATE TABLE IF NOT EXISTS incident_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id INTEGER,
        note TEXT,
        author TEXT,
        created_at INTEGER
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS incident_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id INTEGER,
        type TEXT,
        data TEXT,
        created_at INTEGER
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        created_at INTEGER
    )
    """)

    cur.execute("""
    CREATE INDEX IF NOT EXISTS idx_incidents_fingerprint_status
    ON incidents (fingerprint, status)
    """)

    cur.execute("""
    CREATE INDEX IF NOT EXISTS idx_incidents_source_component_status
    ON incidents (source, component, status)
    """)

    conn.commit()
    conn.close()