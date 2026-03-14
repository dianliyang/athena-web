export function partitionRoadmapItemsByStatus<T extends { status: string; updated_at?: string }>(items: T[]): {
  inProgress: T[];
  completed: T[];
  other: T[];
} {
  const inProgress: T[] = [];
  const completed: T[] = [];
  const other: T[] = [];

  for (const item of items) {
    if (item.status === "in_progress") {
      inProgress.push(item);
    } else if (item.status === "completed") {
      completed.push(item);
    } else {
      other.push(item);
    }
  }

  completed.sort((left, right) => (right.updated_at || "").localeCompare(left.updated_at || ""));

  return { inProgress, completed, other };
}
