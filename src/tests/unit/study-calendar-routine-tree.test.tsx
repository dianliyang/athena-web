import React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import StudyCalendar from "@/components/home/StudyCalendar";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("StudyCalendar routine tree", () => {
  test("renders same-course child items in a visible tree under the parent routine item", () => {
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      value: 400,
    });
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      value: 1200,
    });
    HTMLElement.prototype.scrollTo = vi.fn(function scrollTo(this: HTMLElement, options?: number | ScrollToOptions, y?: number) {
      if (typeof options === "number") {
        this.scrollTop = y ?? 0;
        return;
      }
      this.scrollTop = options?.top ?? 0;
    });

    render(
      <StudyCalendar
        courses={[
          { id: 61, title: "CS 61A", course_code: "CS 61A", university: "Berkeley" },
        ]}
        scheduleRows={[
          {
            event_date: "2026-03-13",
            course_id: 61,
            title: "CS 61A",
            course_code: "CS 61A",
            university: "Berkeley",
            kind: "session",
            start_time: "09:00:00",
            end_time: "10:00:00",
            location: "Home",
            is_completed: false,
            plan_id: 1,
            schedule_id: null,
            assignment_id: null,
            workout_id: null,
            source_type: "study_plan",
          },
          {
            event_date: "2026-03-13",
            course_id: 61,
            title: "CS 61A assignment 1",
            course_code: "CS 61A",
            university: "Berkeley",
            kind: "assignment",
            start_time: "10:00:00",
            end_time: "10:30:00",
            location: null,
            is_completed: false,
            plan_id: null,
            schedule_id: null,
            assignment_id: 10,
            workout_id: null,
            source_type: "assignment",
          },
          {
            event_date: "2026-03-13",
            course_id: 61,
            title: "CS 61A reading 1",
            course_code: "CS 61A",
            university: "Berkeley",
            kind: "review",
            start_time: "10:30:00",
            end_time: "11:00:00",
            location: null,
            is_completed: false,
            plan_id: null,
            schedule_id: 20,
            assignment_id: null,
            workout_id: null,
            source_type: "study_plan",
          },
        ]}
        dict={{
          calendar_weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          calendar_months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        }}
        initialDate={new Date("2026-03-13T09:00:00")}
      />,
    );

    const tree = screen.getByTestId("calendar-routine-tree");
    expect(tree.className).toContain("border-l");
    expect(within(tree).getByText("CS 61A assignment 1")).toBeDefined();
    expect(within(tree).getByText("CS 61A reading 1")).toBeDefined();
    expect(within(tree).getAllByTestId("routine-tree-branch")).toHaveLength(2);
  });
});
