import React from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import OverviewRoutineList from "@/components/dashboard/OverviewRoutineList";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    prefetch,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a
      href={typeof href === "string" ? href : "#"}
      data-prefetch={prefetch == null ? "default" : String(prefetch)}
      {...props}
    >
      {children}
    </a>
  ),
}));

describe("OverviewRoutineList course links", () => {
  afterEach(() => {
    cleanup();
  });

  test("disables course detail prefetch for routine items", () => {
    render(
      <OverviewRoutineList
        initialItems={[
          {
            key: "course-42",
            title: "Algorithms in Practice",
            timeLabel: "09:00",
            startsAtSort: "09:00",
            kind: "Study",
            statusLabel: "Mark complete",
            isDone: false,
            courseId: 42,
            courseCode: "CS-420",
            sourceType: "plan",
            action: {
              type: "toggle_complete",
              date: "2026-03-13",
              planId: 1,
              scheduleId: null,
              assignmentId: null,
            },
          },
        ]}
      />
    );

    const courseLink = screen.getByRole("link", { name: /Algorithms in Practice/i });
    expect(courseLink.getAttribute("data-prefetch")).toBe("false");
  });

  test("renders grouped child routine items inside a nested tree container", () => {
    render(
      <OverviewRoutineList
        initialItems={[
          {
            key: "parent",
            title: "CS 61A",
            timeLabel: "09:00 - 10:00",
            startsAtSort: "09:00",
            kind: "Session",
            statusLabel: "Mark complete",
            isDone: false,
            courseId: 61,
            courseCode: "CS 61A",
            sourceType: "study_plan",
            meta: "CS 61A · Berkeley",
            location: "Home",
            action: {
              type: "toggle_complete",
              date: "2026-03-13",
              planId: 1,
              scheduleId: null,
              assignmentId: null,
            },
          },
          {
            key: "child-assignment",
            title: "CS 61A assignment 1",
            timeLabel: "10:00 - 10:30",
            startsAtSort: "10:00",
            kind: "Assignment",
            statusLabel: "Mark complete",
            isDone: false,
            courseId: 61,
            courseCode: "CS 61A",
            sourceType: "assignment",
            meta: "CS 61A · Berkeley",
            location: null,
            action: {
              type: "toggle_complete",
              date: "2026-03-13",
              planId: null,
              scheduleId: null,
              assignmentId: 11,
            },
          },
          {
            key: "child-reading",
            title: "CS 61A reading 1",
            timeLabel: "10:30 - 11:00",
            startsAtSort: "10:30",
            kind: "Review",
            statusLabel: "Mark complete",
            isDone: false,
            courseId: 61,
            courseCode: "CS 61A",
            sourceType: "study_plan",
            meta: "CS 61A · Berkeley",
            location: null,
            action: {
              type: "toggle_complete",
              date: "2026-03-13",
              planId: null,
              scheduleId: 22,
              assignmentId: null,
            },
          },
        ]}
      />,
    );

    const tree = screen.getByTestId("overview-routine-tree");
    expect(tree.className).toContain("border-l");
    expect(screen.getAllByTestId("routine-tree-branch")).toHaveLength(2);
    expect(tree.textContent).toContain("CS 61A assignment 1");
    expect(tree.textContent).toContain("CS 61A reading 1");
  });
});
