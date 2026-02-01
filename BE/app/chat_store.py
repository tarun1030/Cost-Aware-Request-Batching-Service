"""Chat storage and analytics. Persists request/response pairs to JSON and computes analytics."""

import json
import logging
import os
import threading
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)

DATA_DIR = "data"
CHATS_FILE = "chats.json"
_lock = threading.Lock()


def _path() -> str:
    os.makedirs(DATA_DIR, exist_ok=True)
    return os.path.join(DATA_DIR, CHATS_FILE)


def _load_chats() -> list[dict[str, Any]]:
    path = _path()
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        logger.warning("Failed to load chats from %s: %s", path, e)
        return []


def _save_chats(chats: list[dict[str, Any]]) -> None:
    path = _path()
    with _lock:
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(chats, f, indent=2, ensure_ascii=False)
        except OSError as e:
            logger.warning("Failed to save chats to %s: %s", path, e)


def append_chat(
    request_dict: dict[str, Any],
    response_dict: dict[str, Any],
    batch_id: str | None = None,
) -> None:
    """Append one request/response pair to the chats JSON file. Same batch_id for all items in a batch."""
    chats = _load_chats()
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "batch_id": batch_id,
        "request": request_dict,
        "response": response_dict,
    }
    chats.append(entry)
    _save_chats(chats)


def get_chats() -> list[dict[str, Any]]:
    """Return all stored chats (most recent last)."""
    return _load_chats()


def _normalize_priority(raw: Any) -> str:
    """Return HIGH, MEDIUM, or LOW from stored priority (int or str)."""
    if isinstance(raw, int):
        return {2: "HIGH", 1: "MEDIUM", 0: "LOW"}.get(raw, "MEDIUM")
    if isinstance(raw, str):
        return (raw or "MEDIUM").upper()
    return "MEDIUM"


def get_analytics() -> dict[str, Any]:
    """
    Compute analytics from stored chats for the dashboard.
    Counts BATCHES (combined LLM requests), not individual requests.
    """
    chats = _load_chats()
    # Group by batch_id; entries without batch_id count as one batch each (backward compat)
    batches: dict[str, list[dict]] = defaultdict(list)
    for entry in chats:
        bid = entry.get("batch_id")
        if bid is None:
            bid = f"legacy_{entry.get('timestamp', '')}_{entry.get('request', {}).get('request_id', id(entry))}"
        batches[bid].append(entry)
    total = len(batches)
    high = medium = low = 0
    by_period: dict[str, int] = defaultdict(int)
    for batch_id, entries in batches.items():
        first = entries[0]
        req = first.get("request") or {}
        priority = _normalize_priority(req.get("priority"))
        if priority == "HIGH":
            high += 1
        elif priority == "LOW":
            low += 1
        else:
            medium += 1
        ts = first.get("timestamp") or ""
        if ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                date_key = dt.strftime("%Y-%m-%d")
                by_period[date_key] += 1
            except (ValueError, TypeError):
                pass
    dates_sorted = sorted(by_period.keys())
    request_count_over_time = [{"date": d, "count": by_period[d]} for d in dates_sorted]
    priority_distribution = [
        {"name": "High", "value": high},
        {"name": "Medium", "value": medium},
        {"name": "Low", "value": low},
    ]
    return {
        "total_requests": total,
        "high_priority": high,
        "medium_priority": medium,
        "low_priority": low,
        "request_count_over_time": request_count_over_time,
        "priority_distribution": priority_distribution,
    }
