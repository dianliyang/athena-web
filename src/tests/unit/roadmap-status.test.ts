import { describe, expect, test } from "vitest";
import { partitionRoadmapItemsByStatus } from "@/lib/roadmap-status";

describe("partitionRoadmapItemsByStatus", () => {
  test("separates in-progress and completed items and sorts completed newest first", () => {
    const result = partitionRoadmapItemsByStatus([
      { id: 1, status: "completed", updated_at: "2026-03-10T12:00:00Z" },
      { id: 2, status: "in_progress", updated_at: "2026-03-09T12:00:00Z" },
      { id: 3, status: "completed", updated_at: "2026-03-12T12:00:00Z" },
      { id: 4, status: "pending", updated_at: "2026-03-08T12:00:00Z" },
    ]);

    expect(result.inProgress.map((item) => item.id)).toEqual([2]);
    expect(result.completed.map((item) => item.id)).toEqual([3, 1]);
    expect(result.other.map((item) => item.id)).toEqual([4]);
  });
});
