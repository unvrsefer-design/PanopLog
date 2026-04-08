import os
import time
from typing import Any

import requests

DEFAULT_TIMEOUT = 10
MAX_RETRIES = 2


def _post_with_retry(url: str, payload: dict[str, Any], channel_name: str) -> bool:
    last_error = None

    for attempt in range(1, MAX_RETRIES + 2):
        try:
            response = requests.post(url, json=payload, timeout=DEFAULT_TIMEOUT)

            if 200 <= response.status_code < 300:
                print(f"[notify] {channel_name} success status={response.status_code}")
                return True

            print(
                f"[notify] {channel_name} failed "
                f"status={response.status_code} body={response.text[:500]}"
            )
            last_error = f"HTTP {response.status_code}"

        except Exception as e:
            print(f"[notify] {channel_name} exception attempt={attempt} error={e}")
            last_error = str(e)

        if attempt <= MAX_RETRIES:
            time.sleep(1.5 * attempt)

    print(f"[notify] {channel_name} give up last_error={last_error}")
    return False


def send_discord(msg: str) -> bool:
    url = os.getenv("DISCORD_WEBHOOK_URL", "").strip()

    if not url:
        print("[notify] discord webhook missing")
        return False

    payload = {"content": msg}
    return _post_with_retry(url, payload, "discord")


def send_chat(msg: str) -> bool:
    url = os.getenv("GOOGLE_CHAT_WEBHOOK_URL", "").strip()

    if not url:
        print("[notify] google_chat webhook missing")
        return False

    payload = {"text": msg}
    return _post_with_retry(url, payload, "google_chat")


def build_new_incident_message(analysis: dict, source: str, policy: dict) -> str:
    return f"""🚨 NEW INCIDENT

{analysis.get("short_title", "Unknown Incident")}
Severity: {analysis.get("severity", "-")}
Source: {source}
Component: {analysis.get("component", "-")}
Route: {policy.get("route_target", "-")}
Environment: {policy.get("environment", "-")}

{analysis.get("summary", "-")}
""".strip()


def build_incident_update_message(analysis: dict, source: str, policy: dict) -> str:
    return f"""🚨 INCIDENT UPDATE

{analysis.get("short_title", "Unknown Incident")}
Severity: {analysis.get("severity", "-")}
Source: {source}
Component: {analysis.get("component", "-")}
Route: {policy.get("route_target", "-")}
Environment: {policy.get("environment", "-")}

{analysis.get("summary", "-")}

Occurrence arttı.
""".strip()


def notify_all(msg: str) -> dict[str, bool]:
    discord_ok = send_discord(msg)
    chat_ok = send_chat(msg)

    result = {
        "discord": discord_ok,
        "google_chat": chat_ok,
    }

    print(f"[notify] summary={result}")
    return result