export type CourseDataSource = {
  id: string;
  label: string;
  coverage?: string[];
};

export type CourseDescriptionSection = {
  key: string;
  label: string;
  text: string;
  sourceId?: string;
  sourceLabel?: string;
};

export function readCourseDataSources(details: unknown): CourseDataSource[] {
  if (!details || typeof details !== "object") return [];

  const raw = (details as { dataSources?: unknown }).dataSources;
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const normalized: CourseDataSource[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const candidate = entry as { id?: unknown; label?: unknown; coverage?: unknown };
    const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
    const label = typeof candidate.label === "string" ? candidate.label.trim() : "";
    if (!id || !label || seen.has(id)) continue;
    seen.add(id);
    normalized.push({
      id,
      label,
      coverage: Array.isArray(candidate.coverage)
        ? candidate.coverage.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        : undefined,
    });
  }

  return normalized;
}

export function readCourseDescriptionSections(details: unknown): CourseDescriptionSection[] {
  if (!details || typeof details !== "object") return [];

  const raw = (details as { descriptionSections?: unknown }).descriptionSections;
  if (!Array.isArray(raw)) return [];

  const normalized = raw
    .map<CourseDescriptionSection | null>((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as {
        key?: unknown;
        label?: unknown;
        text?: unknown;
        sourceId?: unknown;
        sourceLabel?: unknown;
      };
      const key = typeof candidate.key === "string" ? candidate.key.trim() : "";
      const label = typeof candidate.label === "string" ? candidate.label.trim() : "";
      const text = typeof candidate.text === "string" ? candidate.text.trim() : "";
      const sourceId = typeof candidate.sourceId === "string" ? candidate.sourceId.trim() : undefined;
      const sourceLabel = typeof candidate.sourceLabel === "string" ? candidate.sourceLabel.trim() : undefined;
      if (!key || !label || !text) return null;
      return {
        key,
        label,
        text,
        ...(sourceId ? { sourceId } : {}),
        ...(sourceLabel ? { sourceLabel } : {}),
      };
    })
    .filter((value): value is CourseDescriptionSection => value !== null);

  return normalized;
}
