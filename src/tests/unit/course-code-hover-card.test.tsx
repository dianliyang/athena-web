import React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock("@/components/ui/hover-card", () => ({
  HoverCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  HoverCardTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  HoverCardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/common/UniversityIcon", () => ({
  default: () => <div data-testid="university-icon" />,
}));

describe("CourseCodeHoverCard", () => {
  test("does not render fixed level or status chips", async () => {
    const { default: CourseCodeHoverCard } = await import("@/components/common/CourseCodeHoverCard");

    render(
      <CourseCodeHoverCard university="CAU Kiel" courseCode="infCV3D-01a" title="3D Computer Vision" />,
    );

    expect(screen.queryByText("Regular")).toBeNull();
    expect(screen.queryByText("Active")).toBeNull();
    expect(screen.queryByText("Status")).toBeNull();
  });
});
