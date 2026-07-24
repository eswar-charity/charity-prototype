PALETTE = [
    "#C62828",
    "#7C3AED",
    "#F5604A",
    "#2C4B6E",
    "#1A2F48",
    "#00897B",
    "#5E35B1",
    "#EF6C00",
]


def derive_initials(name: str) -> str:
    parts = []
    for p in (name or "").strip().split():
        cleaned = "".join(ch for ch in p if ch.isalnum())
        if cleaned:
            parts.append(cleaned)
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def pick_color(name: str) -> str:
    if not name:
        return PALETTE[0]
    idx = sum(ord(ch) for ch in name) % len(PALETTE)
    return PALETTE[idx]
