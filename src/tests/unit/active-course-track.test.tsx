import React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ActiveCourseTrack from "@/components/home/ActiveCourseTrack";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/home/AddPlanModal", () => ({
  default: () => null,
}));

vi.mock("@/components/common/AppToastProvider", () => ({
  useAppToast: () => ({
    showToast: vi.fn(),
  }),
}));

const course = {
  id: 42,
  title: "Algorithms in Practice",
  courseCode: "CS-420",
  university: "Code Campus University",
  url: "https://example.com/course",
  description: "Course description",
  popularity: 10,
  isHidden: false,
  fields: [],
  semesters: ["Spring 2026"],
};

describe("ActiveCourseTrack", () => {
  test("shows schedule times, study days, and inclusive date range for a roadmap plan", () => {
    render(
      <ActiveCourseTrack
        course={course}
        initialProgress={0}
        plan={{
          id: 9,
          start_date: "2026-03-05",
          end_date: "2026-03-05",
          days_of_week: [4],
          start_time: "09:00:00",
          end_time: "11:00:00",
          location: "Library",
        }}
      />
    );

    expect(screen.queryByText("Next Focus")).toBeNull();
    expect(screen.queryByText("Next Date")).toBeNull();
    expect(screen.getByText("Spring 2026")).toBeDefined();
    expect(screen.queryByText("Start time")).toBeNull();
    expect(screen.queryByText("End time")).toBeNull();
    expect(screen.queryByText("Start date")).toBeNull();
    expect(screen.queryByText("End date")).toBeNull();
    expect(screen.getByText("9:00 AM - 11:00 AM")).toBeDefined();
    expect(screen.getByText("Mar 5, 2026 - Mar 5, 2026")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("day")).toBeDefined();
  });
});
