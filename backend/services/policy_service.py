def detect_environment(source: str) -> str:
    lowered = (source or "").lower()

    if "prod" in lowered:
        return "prod"
    if "dev" in lowered:
        return "dev"
    if "test" in lowered or "staging" in lowered:
        return "test"
    return "default"


def build_source_policy(source: str, severity: str, component: str) -> dict:
    environment = detect_environment(source)

    alerts_enabled = environment not in {"dev", "test"}
    route_severities = ["critical", "high"] if alerts_enabled else []

    route_target = "default"
    normalized_component = (component or "").lower()

    if normalized_component == "redis":
        route_target = "cache-team"
    elif normalized_component == "database":
        route_target = "db-team"
    elif normalized_component == "payment":
        route_target = "payments-team"
    elif normalized_component == "api":
        route_target = "api-team"

    normalized_severity = (severity or "").lower()

    if environment == "prod" and normalized_severity == "critical":
        escalation = "immediate"
    elif environment == "prod" and normalized_severity == "high":
        escalation = "priority"
    else:
        escalation = "normal"

    return {
        "environment": environment,
        "alerts_enabled": alerts_enabled,
        "route_severities": route_severities,
        "route_target": route_target,
        "escalation": escalation,
    }


def should_notify(source: str, severity: str, route_severities: set[str] | None = None) -> bool:
    environment = detect_environment(source)

    if environment in {"dev", "test"}:
        return False

    allowed = route_severities or {"critical", "high"}
    return (severity or "").lower() in allowed