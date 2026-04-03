import time
import json
import requests
from pathlib import Path

PANOPLOG_URL = "http://127.0.0.1:8001/ingest"
LOG_FILE_PATH = "/Users/sefer/panoplog/sample.log"
SOURCE_NAME = "sample-agent"

POLL_INTERVAL = 2
BATCH_SIZE = 5

IMPORTANT_KEYWORDS = [
    "error",
    "critical",
    "exception",
    "fail",
    "timeout",
    "refused",
]

SEVERITY_MAP = {
    "critical": "critical",
    "error": "high",
    "exception": "high",
    "fail": "high",
    "timeout": "high",
    "refused": "high",
}


def is_important_line(line: str) -> bool:
    lowered = line.lower()
    return any(keyword in lowered for keyword in IMPORTANT_KEYWORDS)


def detect_severity_hint(log_lines: list[str]) -> str:
    joined = " ".join(log_lines).lower()

    for keyword, severity in SEVERITY_MAP.items():
        if keyword in joined:
            return severity

    return "medium"


def send_to_panoplog(log_lines):
    severity_hint = detect_severity_hint(log_lines)

    payload = {
        "source": SOURCE_NAME,
        "severity_hint": severity_hint,
        "metadata": {
            "agent": "log_forwarder",
            "file": LOG_FILE_PATH,
            "filtering": "smart-keyword-filter",
        },
        "log_text": "\n".join(log_lines),
    }

    try:
        response = requests.post(PANOPLOG_URL, json=payload, timeout=30)
        print("Gönderildi:", response.status_code)
        try:
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        except Exception:
            print(response.text)
    except Exception as e:
        print("Gönderim hatası:", e)


def follow_file():
    path = Path(LOG_FILE_PATH)

    if not path.exists():
        print(f"Log dosyası bulunamadı: {LOG_FILE_PATH}")
        return

    print(f"İzleniyor: {LOG_FILE_PATH}")
    print(f"Filtre aktif: {IMPORTANT_KEYWORDS}")

    buffer = []

    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        f.seek(0, 2)

        while True:
            line = f.readline()

            if not line:
                time.sleep(POLL_INTERVAL)
                continue

            clean_line = line.strip()
            if not clean_line:
                continue

            print("Yeni satır:", clean_line)

            if is_important_line(clean_line):
                print("Önemli log yakalandı ✅")
                buffer.append(clean_line)
            else:
                print("Önemsiz log, gönderilmeyecek ⏭️")

            if len(buffer) >= BATCH_SIZE:
                send_to_panoplog(buffer)
                buffer = []


if __name__ == "__main__":
    follow_file()