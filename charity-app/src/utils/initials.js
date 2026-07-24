/** Derive avatar initials from a display name (mirrors backend derive_initials). */
export function initialsFromName(name, fallback = '?') {
  if (!name || !String(name).trim()) return fallback;
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .map((p) => p.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean);
  if (!parts.length) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
