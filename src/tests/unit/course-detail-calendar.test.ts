import { describe, expect, test } from "vitest";
import { buildCourseDetailCalendar } from "@/lib/course-detail-calendar";

describe("buildCourseDetailCalendar", () => {
  test("includes recurring study plan sessions even when there are no assignments", () => {
    const result = buildCourseDetailCalendar({
      courseTitle: "Fundamentals of Programming",
      assignments: [],
      scheduleItems: [],
      studyPlans: [
        {
          id: 10,
          startDate: "2026-03-05",
          endDate: "2026-03-05",
          daysOfWeek: [4],
          startTime: "09:00",
          endTime: "11:00",
          location: "Library",
          kind: "Self-Study",
        },
      ],
    });

    expect(result.range).toEqual({
      startIso: "2026-03-05",
      endIso: "2026-03-05",
    });
    expect(result.eventsByDate.get("2026-03-05")).toEqual([
      {
        label: "Fundamentals of Programming",
        meta: "Self-Study · 09:00-11:00 · Library",
        kind: "self-study",
      },
    ]);
  });
});
