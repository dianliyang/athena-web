import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import StudyCalendar from "@/components/home/StudyCalendar";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const makeProps = () => ({
  courses: [
    { id: 1, title: "Course A", status: "in_progress", progress: 0, updated_at: "2026-02-03" },
    { id: 2, title: "Course B", status: "in_progress", progress: 0, updated_at: "2026-02-03" },
  ],
  plans: [
    {
      id: 10,
      course_id: 1,
      start_date: "2026-02-01",
      end_date: "2026-02-28",
      days_of_week: [2],
      start_time: "10:00",
      end_time: "11:00",
      location: "Room 101",
      kind: "lecture",
      courses: { id: 1, title: "Course A", course_code: "A101", university: "CCU" },
    },
    {
      id: 20,
      course_id: 2,
      start_date: "2026-02-01",
      end_date: "2026-02-28",
      days_of_week: [3],
      start_time: "14:00",
      end_time: "15:00",
      location: "Room 202",
      kind: "lab",
      courses: { id: 2, title: "Course B", course_code: "B102", university: "CCU" },
    },
  ],
  logs: [],
  dict: {
    calendar_title: "Study Schedule",
    calendar_today: "Today",
    calendar_no_events: "No activities",
    calendar_events: "Select a day",
    calendar_study: "Study",
    calendar_rest: "Rest",
    calendar_study_day: "Study Day",
    calendar_rest_day: "Rest Day",
    calendar_rest_message: "Rest today, study tomorrow",
    calendar_generating: "Generating...",
    calendar_generate_plan: "Generate Plan",
    calendar_courses_scheduled: "scheduled",
    calendar_weekdays: ["S", "M", "T", "W", "T", "F", "S"],
    calendar_months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
  initialDate: new Date(2026, 1, 3, 10, 0, 0),
});

describe("StudyCalendar redesign", () => {
  beforeEach(() => {
    refreshMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("toggles an event between not completed and completed", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<StudyCalendar {...makeProps()} />);

    const todayRow = screen.getByRole("button", { name: /toggle completion for course a/i });
    expect(screen.queryByText("Not completed")).toBeNull();

    fireEvent.click(todayRow);

    await waitFor(() => {
      expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/schedule", expect.objectContaining({
      method: "POST",
    }));
    expect(refreshMock).toHaveBeenCalled();
  });

  test("shows only today's events in the left today list", () => {
    render(<StudyCalendar {...makeProps()} />);

    const todayList = screen.getAllByTestId("today-events-list")[0];
    expect(todayList.textContent).toContain("Course A");
    expect(todayList.textContent).not.toContain("Course B");
  });

  test("navigates weeks by prev/next controls", () => {
    render(<StudyCalendar {...makeProps()} />);

    expect(screen.getAllByText("Feb 1 - Feb 7, 2026").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Next week" })[0]);
    expect(screen.getAllByText("Feb 8 - Feb 14, 2026").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Previous week" })[0]);
    expect(screen.getAllByText("Feb 1 - Feb 7, 2026").length).toBeGreaterThan(0);
  });

  test("mini calendar today button resets month and week to today", () => {
    render(<StudyCalendar {...makeProps()} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Next month" })[0]);
    expect(screen.getByText("Mar 2026")).toBeDefined();

    fireEvent.click(screen.getAllByRole("button", { name: "Mini calendar today" })[0]);

    expect(screen.getAllByText("Feb 2026").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Feb 1 - Feb 7, 2026").length).toBeGreaterThan(0);
  });

  test("clicking another event focuses a different course event", () => {
    render(<StudyCalendar {...makeProps()} />);

    fireEvent.click(screen.getAllByRole("button", { name: /Course A/i })[0]);
    expect(screen.getAllByText("A101").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: /Course B/i })[0]);
    expect(screen.getAllByText("B102").length).toBeGreaterThan(0);
  });

});
