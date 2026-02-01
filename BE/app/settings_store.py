"""Runtime settings (API key, priority thresholds). Persisted to JSON for FE configuration."""

import json
import logging
import os
import threading
from typing import Any

logger = logging.getLogger(__name__)

DATA_DIR = "data"
SETTINGS_FILE = "settings.json"
_lock = threading.Lock()

# Defaults matching the Settings UI (Tokens | Latency)
DEFAULT_THRESHOLDS = {
    "high_priority": {"tokens": 512, "latency_ms": 100},
    "medium_priority": {"tokens": 1024, "latency_ms": 200},
    "low_priority": {"tokens": 2048, "latency_ms": 300},
}


def _path() -> str:
    os.makedirs(DATA_DIR, exist_ok=True)
    return os.path.join(DATA_DIR, SETTINGS_FILE)


def _load_raw() -> dict[str, Any]:
    path = _path()
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        logger.warning("Failed to load settings from %s: %s", path, e)
        return {}


def _save_raw(data: dict[str, Any]) -> None:
    path = _path()
    with _lock:
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except OSError as e:
            logger.warning("Failed to save settings to %s: %s", path, e)


def get_settings() -> dict[str, Any]:
    """Current settings for GET /v1/settings. API key is masked (***...last4)."""
    raw = _load_raw()
    api_key = raw.get("api_key") or "AIzaSyDrajsmIVXSu7JFVveeyKiXnaxwuEVwgNE"
    masked = ("***" + api_key[-4:]) if len(api_key) >= 4 else ("***" if api_key else None)
    high = raw.get("high_priority") or DEFAULT_THRESHOLDS["high_priority"]
    medium = raw.get("medium_priority") or DEFAULT_THRESHOLDS["medium_priority"]
    low = raw.get("low_priority") or DEFAULT_THRESHOLDS["low_priority"]
    return {
        "api_key": masked,
        "high_priority": {"tokens": high.get("tokens", 512), "latency_ms": high.get("latency_ms", 100)},
        "medium_priority": {"tokens": medium.get("tokens", 1024), "latency_ms": medium.get("latency_ms", 200)},
        "low_priority": {"tokens": low.get("tokens", 2048), "latency_ms": low.get("latency_ms", 300)},
    }


def update_settings(updates: dict[str, Any]) -> dict[str, Any]:
    """Merge updates into settings and save. Returns current get_settings()."""
    raw = _load_raw()
    if "api_key" in updates and updates["api_key"] is not None:
        raw["api_key"] = updates["api_key"]
    for key in ("high_priority", "medium_priority", "low_priority"):
        if key in updates and updates[key] is not None:
            raw[key] = {**(raw.get(key) or {}), **updates[key]}
    _save_raw(raw)
    return get_settings()


def get_api_key() -> str | None:
    """Raw API key from settings file, or None if not set (caller uses config default)."""
    raw = _load_raw()
    key = raw.get("api_key") or ""
    return key.strip() or None


def get_thresholds(priority_name: str) -> dict[str, int | float]:
    """Thresholds for a priority (HIGH, MEDIUM, LOW). Returns { tokens, latency_ms }."""
    raw = _load_raw()
    key = priority_name.lower() + "_priority"
    if key == "high_priority":
        default = DEFAULT_THRESHOLDS["high_priority"]
    elif key == "medium_priority":
        default = DEFAULT_THRESHOLDS["medium_priority"]
    else:
        default = DEFAULT_THRESHOLDS["low_priority"]
    stored = raw.get(key) or {}
    return {
        "tokens": stored.get("tokens", default["tokens"]),
        "latency_ms": stored.get("latency_ms", default["latency_ms"]),
    }
