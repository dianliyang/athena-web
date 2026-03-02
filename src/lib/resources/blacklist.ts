const BLOCK_URL_PREFIX = "block_url";

export function normalizeBlacklistCourseCode(courseCode: string): string {
  return String(courseCode || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function normalizeResourceDomainPath(url: string): { domain: string; path: string } | null {
  try {
    const u = new URL(url.trim());
    const domain = u.hostname.replace(/^www\./i, "").toLowerCase();
    const path = (u.pathname || "/").replace(/\/{2,}/g, "/").replace(/\/+$/g, "") || "/";
    if (!domain) return null;
    return { domain, path };
  } catch {
    return null;
  }
}

export function buildResourceBlacklistKey(courseCode: string, url: string): string | null {
  const normalizedCode = normalizeBlacklistCourseCode(courseCode);
  const normalized = normalizeResourceDomainPath(url);
  if (!normalizedCode || !normalized) return null;
  return `${BLOCK_URL_PREFIX}:${normalizedCode}:${normalized.domain}:${normalized.path}`;
}
