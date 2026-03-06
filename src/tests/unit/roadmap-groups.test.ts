import { describe, expect, test } from "vitest";
import { groupRoadmapCoursesByPlan } from "@/lib/roadmap-groups";

describe("groupRoadmapCoursesByPlan", () => {
  test("splits in-progress courses into active and planning and sorts by start date/time", () => {
    const courses = [
      { id: 1, title: "Course C" },
      { id: 2, title: "Course A" },
      { id: 3, title: "Course B" },
      { id: 4, title: "Course D" },
    ];
    const plans = [
      { course_id: 1, start_date: "2026-03-05", start_time: "14:00:00" },
      { course_id: 2, start_date: "2026-03-05", start_time: "09:00:00" },
      { course_id: 3, start_date: "2026-03-10", start_time: "08:30:00" },
    ];

    const result = groupRoadmapCoursesByPlan(courses, plans, "2026-03-06");

    expect(result.active.map((item) => item.course.title)).toEqual([
      "Course A",
      "Course C",
    ]);
    expect(result.planning.map((item) => item.course.title)).toEqual([
      "Course B",
      "Course D",
    ]);
    expect(result.planning[0]?.plan?.start_date).toBe("2026-03-10");
    expect(result.planning[1]?.plan).toBeNull();
  });
});
