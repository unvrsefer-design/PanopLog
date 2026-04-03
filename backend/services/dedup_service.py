import hashlib
import re

from db import get_db, execute, fetchall_dict


def fingerprint(source: str, component: str, title: str) -> str:
    raw = f"{source}|{component}|{title}".lower()
    return hashlib.md5(raw.encode()).hexdigest()


def normalize_text(text: str) -> str:
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def token_set(text: str) -> set[str]:
    return set(normalize_text(text).split())


def jaccard_similarity(a: str, b: str) -> float:
    sa = token_set(a)
    sb = token_set(b)

    if not sa or not sb:
        return 0.0

    intersection = len(sa & sb)
    union = len(sa | sb)
    return intersection / union if union else 0.0


def find_semantic_match(source: str, component: str, summary: str):
    conn = get_db()
    cur = conn.cursor()

    execute(
        cur,
        """
        SELECT *
        FROM incidents
        WHERE source = ?
          AND component = ?
          AND status IN ('open', 'acknowledged')
        ORDER BY last_seen_at DESC
        LIMIT 20
        """,
        (source, component),
    )

    rows = fetchall_dict(cur)
    conn.close()

    best_row = None
    best_score = 0.0

    for row in rows:
        score = jaccard_similarity(summary, row.get("summary") or "")
        if score > best_score:
            best_score = score
            best_row = row

    return best_row, best_score