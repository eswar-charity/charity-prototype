"""Encode/decode structured change-request notes stored on EventReview.note."""

from __future__ import annotations

import json
from typing import Any

VALID_AREAS = frozenset({"media_story", "nonprofit", "date_location"})


def encode_change_request_note(feedback: str, areas: list[str] | None) -> str:
    clean_areas = [a for a in (areas or []) if a in VALID_AREAS]
    # Prefer unique, stable order matching wizard steps.
    ordered = [a for a in ("media_story", "nonprofit", "date_location") if a in clean_areas]
    if not ordered:
        return feedback
    return json.dumps({"feedback": feedback, "areas": ordered}, separators=(",", ":"))


def decode_change_request_note(note: str | None) -> dict[str, Any]:
    if not note:
        return {"feedback": "", "areas": []}
    try:
        data = json.loads(note)
    except (TypeError, json.JSONDecodeError):
        return {"feedback": note, "areas": []}
    if not isinstance(data, dict):
        return {"feedback": note, "areas": []}
    feedback = data.get("feedback")
    if not isinstance(feedback, str):
        feedback = note
    raw_areas = data.get("areas") or []
    areas = [a for a in raw_areas if a in VALID_AREAS] if isinstance(raw_areas, list) else []
    ordered = [a for a in ("media_story", "nonprofit", "date_location") if a in areas]
    return {"feedback": feedback, "areas": ordered}
