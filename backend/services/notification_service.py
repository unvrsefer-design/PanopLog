import os
import requests


def send_discord(msg: str):
    url = os.getenv("DISCORD_WEBHOOK_URL")
    if not url:
        print("DISCORD webhook yok")
        return

    try:
        response = requests.post(url, json={"content": msg}, timeout=10)
        print("Discord status:", response.status_code)
    except Exception as e:
        print("Discord error:", e)


def send_chat(msg: str):
    url = os.getenv("GOOGLE_CHAT_WEBHOOK_URL")
    if not url:
        print("CHAT webhook yok")
        return

    try:
        response = requests.post(url, json={"text": msg}, timeout=10)
        print("Chat status:", response.status_code)
    except Exception as e:
        print("Chat error:", e)


def build_new_incident_message(analysis: dict, source: str, policy: dict) -> str:
    return f"""🚨 NEW INCIDENT

{analysis.get("short_title", "Unknown Incident")}
Severity: {analysis.get("severity", "-")}
Source: {source}
Component: {analysis.get("component", "-")}
Route: {policy.get("route_target", "-")}

{analysis.get("summary", "-")}
""".strip()


def build_incident_update_message(analysis: dict, source: str, policy: dict) -> str:
    return f"""🚨 INCIDENT UPDATE

{analysis.get("short_title", "Unknown Incident")}
Severity: {analysis.get("severity", "-")}
Source: {source}
Component: {analysis.get("component", "-")}
Route: {policy.get("route_target", "-")}

{analysis.get("summary", "-")}

Occurrence arttı.
""".strip()


def notify_all(msg: str):
    send_discord(msg)
    send_chat(msg)