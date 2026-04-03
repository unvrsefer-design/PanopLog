from db import get_db, execute, fetchone_dict


def get_learned_fix(component: str):
    conn = get_db()
    cur = conn.cursor()

    execute(
        cur,
        """
        SELECT actual_fix
        FROM incidents
        WHERE component = ?
          AND worked = 1
          AND actual_fix IS NOT NULL
          AND TRIM(actual_fix) != ''
        ORDER BY last_seen_at DESC
        LIMIT 1
        """,
        (component,),
    )

    row = fetchone_dict(cur)
    conn.close()

    if row:
        return row["actual_fix"]
    return None


def apply_learned_fix(analysis: dict) -> tuple[dict, bool, str | None]:
    component = analysis.get("component")

    if not component:
        return analysis, False, None

    learned_fix = get_learned_fix(component)

    if not learned_fix:
        return analysis, False, None

    learned_fix = str(learned_fix).strip()

    if not learned_fix:
        return analysis, False, None

    current_fix = (analysis.get("likely_fix") or "").strip()

    if current_fix:
        analysis["likely_fix"] = f"{current_fix}\n\nLearned fix: {learned_fix}"
    else:
        analysis["likely_fix"] = f"Learned fix: {learned_fix}"

    return analysis, True, learned_fix