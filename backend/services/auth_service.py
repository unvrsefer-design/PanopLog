import base64
import hashlib
import time

from db import get_db, execute, fetchone_dict, is_postgres


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_user(username: str, password: str):
    conn = get_db()
    cur = conn.cursor()

    try:
        if is_postgres():
            cur.execute(
                """
                INSERT INTO users (username, password, created_at)
                VALUES (%s, %s, %s)
                RETURNING id
                """,
                (
                    username,
                    hash_password(password),
                    int(time.time()),
                ),
            )
            row = cur.fetchone()
            user_id = row[0] if row else None
        else:
            execute(
                cur,
                """
                INSERT INTO users (username, password, created_at)
                VALUES (?, ?, ?)
                """,
                (
                    username,
                    hash_password(password),
                    int(time.time()),
                ),
            )
            user_id = cur.lastrowid

        conn.commit()
        conn.close()

        return {
            "success": True,
            "user_id": user_id,
            "username": username,
        }
    except Exception as e:
        conn.close()
        return {
            "success": False,
            "error": str(e),
        }


def authenticate_user(username: str, password: str):
    conn = get_db()
    cur = conn.cursor()

    execute(
        cur,
        """
        SELECT * FROM users
        WHERE username = ? AND password = ?
        LIMIT 1
        """,
        (
            username,
            hash_password(password),
        ),
    )

    row = fetchone_dict(cur)
    conn.close()

    if not row:
        return None

    return {
        "id": row["id"],
        "username": row["username"],
        "created_at": row["created_at"],
    }


def generate_token(username: str) -> str:
    raw = f"{username}:{int(time.time())}"
    return base64.b64encode(raw.encode()).decode()


def get_username_from_token(token: str) -> str | None:
    try:
        decoded = base64.b64decode(token.encode()).decode()
        username = decoded.split(":")[0].strip()
        return username or None
    except Exception:
        return None


def get_user_by_username(username: str):
    conn = get_db()
    cur = conn.cursor()

    execute(
        cur,
        """
        SELECT * FROM users
        WHERE username = ?
        LIMIT 1
        """,
        (username,),
    )

    row = fetchone_dict(cur)
    conn.close()

    if not row:
        return None

    return {
        "id": row["id"],
        "username": row["username"],
        "created_at": row["created_at"],
    }


def get_current_user_from_authorization(authorization: str | None):
    if not authorization:
        return None

    try:
        token = authorization.replace("Bearer ", "").strip()
    except Exception:
        return None

    if not token:
        return None

    username = get_username_from_token(token)

    if not username:
        return None

    return get_user_by_username(username)