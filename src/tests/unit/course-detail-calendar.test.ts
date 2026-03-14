import { describe, expect, test } from "vitest";
import { buildCourseDetailCalendar } from "@/lib/course-detail-calendar";

describe("buildCourseDetailCalendar", () => {
  test("expands recurring study plan sessions into calendar events across the saved range", () => {
    const result = buildCourseDetailCalendar({
      assignments: [],
      scheduleItems: [],
      studyPlans: [
        {
          id: 10,
          startDate: "2025-10-19",
          endDate: "2026-02-08",
          daysOfWeek: [1],
          startTime: "09:00",
          endTime: "11:00",
          location: "Library",
          kind: "Self-Study",
        },
      ],
    });

    expect(result.range).toEqual({
      startIso: "2025-10-20",
      endIso: "2026-02-02",
    });
    expect(result.eventsByDate.get("2025-10-20")).toEqual([
      {
        label: "Self-Study",
        meta: "self-study · 09:00-11:00 · Library",
        kind: "self-study",
        badgeLabel: "self-study",
        timeLabel: "09:00-11:00",
        isCompleted: false,
      },
    ]);
    expect(result.eventsByDate.get("2026-02-02")).toEqual([
      {
        label: "Self-Study",
        meta: "self-study · 09:00-11:00 · Library",
        kind: "self-study",
        badgeLabel: "self-study",
        timeLabel: "09:00-11:00",
        isCompleted: false,
      },
    ]);
  });

  test("keeps scheduled task duration and infers a concrete kind from the task text", () => {
    const result = buildCourseDetailCalendar({
      assignments: [],
      scheduleItems: [
        {
          date: "2026-03-10",
          title: "Read cache notes",
          kind: null,
          focus: "Caching",
          durationMinutes: 45,
        },
      ],
      studyPlans: [],
    });

    expect(result.eventsByDate.get("2026-03-10")).toEqual([
      {
        label: "Read cache notes",
        meta: "reading · 45m",
        kind: "reading",
        badgeLabel: "reading",
        timeLabel: "45m",
        isCompleted: false,
      },
    ]);
  });

  test("uses inferred lecture kind when the explicit kind is only a generic task", () => {
    const result = buildCourseDetailCalendar({
      assignments: [],
      scheduleItems: [
        {
          date: "2026-03-10",
          title: "Lecture: Why Parallelism? Why Efficiency?",
          kind: "task",
          focus: null,
          durationMinutes: 65,
        },
      ],
      studyPlans: [],
    });

    expect(result.eventsByDate.get("2026-03-10")).toEqual([
      {
        label: "Lecture: Why Parallelism? Why Efficiency?",
        meta: "lecture · 65m",
        kind: "lecture",
        badgeLabel: "lecture",
        timeLabel: "65m",
        isCompleted: false,
      },
    ]);
  });

  test("marks scheduled tasks completed only when the date exists in completion logs", () => {
    const result = buildCourseDetailCalendar({
      assignments: [],
      scheduleItems: [
        {
          date: "2026-03-10",
          title: "Read cache notes",
          kind: null,
          focus: "Caching",
          durationMinutes: 45,
        },
      ],
      studyPlans: [],
      completionByDate: new Map([["2026-03-10", true]]),
    });

    expect(result.eventsByDate.get("2026-03-10")?.[0]?.isCompleted).toBe(true);
  });
});
