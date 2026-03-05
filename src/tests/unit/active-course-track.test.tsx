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
  semesters: [],
};

describe("ActiveCourseTrack", () => {
  test("shows start date, end date, and inclusive total days for a roadmap plan", () => {
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

    expect(screen.getByText("Start")).toBeDefined();
    expect(screen.getByText("End")).toBeDefined();
    expect(screen.getByText("Total")).toBeDefined();
    expect(screen.getAllByText("Mar 5, 2026").length).toBe(2);
    expect(screen.getByText("1 day")).toBeDefined();
  });
});
