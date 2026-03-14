import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CourseDetailHeader from "@/components/courses/CourseDetailHeader";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/common/AppToastProvider", () => ({
  useAppToast: () => ({
    showToast: vi.fn(),
  }),
}));

const fetchMock = vi.fn(async () => ({
  ok: false,
  json: async () => ({}),
}));

vi.stubGlobal("fetch", fetchMock);

const baseCourse = {
  id: 1,
  title: "Advanced Systems",
  university: "MIT",
  courseCode: "6.9995",
  url: "https://example.com",
  description: "",
  popularity: 0,
  isHidden: false,
  isInternal: false,
  fields: [],
  semesters: [],
};

describe("CourseDetailHeader", () => {
  beforeEach(() => {
    fetchMock.mockClear();
  });

  test("renders university and course code with the same plain meta style", () => {
    render(<CourseDetailHeader course={baseCourse} />);

    const meta = screen.getByTestId("course-detail-meta");
    expect(meta.textContent).toContain("MIT");
    expect(meta.textContent).toContain("6.9995");
    expect(meta.querySelector("[data-slot='badge']")).toBeNull();
  });

  test("keeps the header sticky on mobile and exposes AI sync only inside the actions menu", async () => {
    render(<CourseDetailHeader course={baseCourse} />);

    const header = screen.getByRole("banner");
    expect(header.className).toContain("sticky");
    expect(header.className).toContain("top-0");
    expect(screen.queryByText(/auto/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

    await waitFor(() => {
      expect(screen.getByText("AI Sync Mode")).toBeDefined();
    });

    expect(screen.getByText("Run AI Sync")).toBeDefined();
    expect(screen.getByText("Auto")).toBeDefined();
    expect(screen.getByText("Existing")).toBeDefined();
    expect(screen.getByText("Fresh")).toBeDefined();
  });

  test("renders course data source badges from details metadata", () => {
    render(
      <CourseDetailHeader
        course={{
          ...baseCourse,
          details: {
            dataSources: [
              { id: "univis", label: "UnivIS" },
              { id: "moduldb", label: "ModulDB" },
            ],
          },
        }}
      />,
    );

    const sources = screen.getByTestId("course-data-sources");
    expect(sources.textContent).toContain("Sources");
    expect(sources.textContent).toContain("UnivIS");
    expect(sources.textContent).toContain("ModulDB");
  });
});
