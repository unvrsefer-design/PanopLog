import json
import re
from openai import OpenAI

client = OpenAI()


def fallback_analysis(log_text: str) -> dict:
    lowered = log_text.lower()

    if "redis" in lowered:
        component = "redis"
        short_title = "Redis bağlantı / timeout hatası"
        possible_cause = "Redis servisi kapalı, yavaş veya ağ erişimi sorunlu olabilir."
        first_action = "Redis servis durumu ve erişim bilgisini kontrol et."
        likely_fix = "Redis servisini ve bağlantı ayarlarını doğrula, gerekirse yeniden başlat."
        verification_step = "Redis bağlantısını tekrar test et ve timeout loglarının kesildiğini doğrula."
        risk_note = "Bağımlı servislerde erişim ve gecikme problemi oluşabilir."
    else:
        component = "system"
        short_title = "Genel uygulama hatası"
        possible_cause = "Servis, ağ veya bağımlı bileşen kaynaklı geçici hata olabilir."
        first_action = "İlgili servisin sağlık durumunu ve son loglarını kontrol et."
        likely_fix = "Servis konfigürasyonu ve bağımlı servis erişimini doğrula."
        verification_step = "Yeni loglarda aynı hatanın tekrar edip etmediğini kontrol et."
        risk_note = "Servis kararlılığı etkilenebilir."

    if "critical" in lowered or "timeout" in lowered:
        severity = "critical"
    elif "error" in lowered or "exception" in lowered:
        severity = "high"
    elif "warn" in lowered:
        severity = "medium"
    else:
        severity = "low"

    lines = [line for line in log_text.splitlines() if line.strip()]
    highlighted = lines[:2] if lines else [log_text[:200]]
    context_blocks = [lines[:5]] if lines else [[log_text[:200]]]

    return {
        "short_title": short_title,
        "severity": severity,
        "component": component,
        "summary": "Log içinde anlamlı hata paterni tespit edildi.",
        "possible_cause": possible_cause,
        "first_action": first_action,
        "likely_fix": likely_fix,
        "verification_step": verification_step,
        "risk_note": risk_note,
        "runbook_steps": [
            "İlgili servisin çalıştığını doğrula",
            "Bağımlı servis erişimini kontrol et",
            "Timeout / connection ayarlarını gözden geçir",
            "Gerekirse servisi yeniden başlat",
            "Loglarda tekrar olup olmadığını izle",
        ],
        "highlighted_lines": highlighted,
        "context_blocks": context_blocks,
        "used_fallback": True,
    }


def analyze_log_with_ai(log_text: str) -> dict:
    prompt = f"""
Sen log analiz asistanısın.
Aşağıdaki log için sadece JSON döndür.

Format:
{{
  "short_title": "",
  "severity": "low|medium|high|critical",
  "component": "",
  "summary": "",
  "possible_cause": "",
  "first_action": "",
  "likely_fix": "",
  "verification_step": "",
  "risk_note": "",
  "runbook_steps": ["", ""],
  "highlighted_lines": []
}}

Kurallar:
- Kısa ve net yaz
- JSON dışında hiçbir şey yazma
- runbook_steps en fazla 5 madde olsun
- highlighted_lines logdan seçilmiş satırlar olsun

Log:
{log_text[:4000]}
"""

    try:
        response = client.responses.create(
            model="gpt-4o-mini",
            input=prompt,
        )
        raw = response.output_text.strip()
        match = re.search(r"\{.*\}", raw, re.DOTALL)

        if not match:
            return fallback_analysis(log_text)

        parsed = json.loads(match.group(0))

        runbook_steps = parsed.get("runbook_steps", [])
        if not isinstance(runbook_steps, list):
            runbook_steps = []

        highlighted = parsed.get("highlighted_lines", [])
        if not isinstance(highlighted, list):
            highlighted = []

        lines = [line for line in log_text.splitlines() if line.strip()]
        context_blocks = [lines[:5]] if lines else [[log_text[:200]]]

        return {
            "short_title": parsed.get("short_title", "Otomatik Incident"),
            "severity": parsed.get("severity", "high"),
            "component": parsed.get("component", "unknown"),
            "summary": parsed.get("summary", "Log içinde hata tespit edildi."),
            "possible_cause": parsed.get("possible_cause", ""),
            "first_action": parsed.get("first_action", ""),
            "likely_fix": parsed.get("likely_fix", ""),
            "verification_step": parsed.get("verification_step", ""),
            "risk_note": parsed.get("risk_note", ""),
            "runbook_steps": runbook_steps[:5],
            "highlighted_lines": highlighted[:5],
            "context_blocks": context_blocks,
            "used_fallback": False,
        }

    except Exception as e:
        print("AI analyze fallback:", e)
        return fallback_analysis(log_text)