import json
import os

from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """
You are an expert Site Reliability Engineer (SRE).

Analyze the given logs and return a structured incident analysis.

Respond ONLY in English.

Return valid JSON with exactly these fields:
- short_title
- severity
- component
- summary
- possible_cause
- first_action
- verification_step
- likely_fix
- risk_note
- highlighted_lines
- context_blocks
- runbook_steps

Rules:
- short_title: very short, max 6 words
- severity: one of critical, high, medium, low
- component: short system/component name
- summary: 1 concise sentence
- possible_cause: 1 concise sentence
- first_action: 1 concise sentence
- verification_step: 1 concise sentence
- likely_fix: 1-2 concise sentences
- risk_note: 1 concise sentence
- highlighted_lines: array of strings
- context_blocks: array of strings
- runbook_steps: array of short strings

Do not add markdown.
Do not add explanations outside JSON.
""".strip()


def _fallback_analysis(log_text: str) -> dict:
    lowered = log_text.lower()

    severity = "medium"
    component = "system"
    short_title = "Application Error"

    if any(word in lowered for word in ["critical", "sev1", "outage", "down"]):
        severity = "critical"
        short_title = "Critical Service Outage"
    elif any(word in lowered for word in ["timeout", "failed", "failure", "error"]):
        severity = "high"
        short_title = "Service Failure"

    if "redis" in lowered:
        component = "redis"
        short_title = "Redis Connection Failure"
    elif "postgres" in lowered or "database" in lowered or "db" in lowered:
        component = "database"
        short_title = "Database Connection Error"
    elif "payment" in lowered:
        component = "payment-service"
        short_title = "Payment Service Failure"
    elif "auth" in lowered:
        component = "auth-service"
        short_title = "Authentication Service Error"
    elif "api" in lowered:
        component = "api"
        short_title = "API Service Error"

    return {
        "short_title": short_title,
        "severity": severity,
        "component": component,
        "summary": "Detected a meaningful error pattern in the provided logs.",
        "possible_cause": "The issue is likely caused by a service dependency or infrastructure-level failure.",
        "first_action": "Check the health of the affected service and review the most recent error logs.",
        "verification_step": "Confirm whether the same error continues to appear in new logs after mitigation.",
        "likely_fix": "Review service configuration, connectivity, and dependent systems, then restart or recover the failing component if needed.",
        "risk_note": "If unresolved, the issue may continue to impact service availability.",
        "highlighted_lines": [line for line in log_text.splitlines()[:5] if line.strip()],
        "context_blocks": [log_text[:600]] if log_text.strip() else [],
        "runbook_steps": [
            "Check service health",
            "Inspect recent logs",
            "Validate dependencies",
            "Apply fix and verify",
        ],
    }


def analyze_log_with_ai(log_text: str) -> dict:
    user_prompt = f"""
Analyze the following logs and generate an incident report.

LOGS:
{log_text}
""".strip()

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        )

        content = response.choices[0].message.content
        data = json.loads(content)

        return {
            "short_title": data.get("short_title", "Unknown Incident"),
            "severity": data.get("severity", "medium").lower(),
            "component": data.get("component", "system"),
            "summary": data.get("summary", ""),
            "possible_cause": data.get("possible_cause", ""),
            "first_action": data.get("first_action", ""),
            "verification_step": data.get("verification_step", ""),
            "likely_fix": data.get("likely_fix", ""),
            "risk_note": data.get("risk_note", ""),
            "highlighted_lines": data.get("highlighted_lines", []),
            "context_blocks": data.get("context_blocks", []),
            "runbook_steps": data.get("runbook_steps", []),
        }

    except Exception as e:
        print("AI analyze fallback:", e)
        return _fallback_analysis(log_text)