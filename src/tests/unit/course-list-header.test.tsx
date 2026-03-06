import React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CourseListHeader from "@/components/home/CourseListHeader";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("CourseListHeader", () => {
  test("renders toolbar controls without embedding the page title block", () => {
    render(
      <CourseListHeader
        viewMode="list"
        setViewMode={vi.fn()}
        dict={{} as never}
        filterUniversities={[]}
        filterSemesters={[]}
      />,
    );

    expect(screen.queryByText("Explore the catalog and enroll in courses.")).toBeNull();
    expect(screen.getByRole("link", { name: /new course/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /filter/i })).toBeDefined();
  });
});
