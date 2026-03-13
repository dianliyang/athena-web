import React from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  WorkoutPrice,
  getPrimaryWorkoutPrice,
  getWorkoutPriceDetails,
} from "@/components/workouts/WorkoutPrice";

vi.mock("@/components/ui/hover-card", () => ({
  HoverCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  HoverCardTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  HoverCardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="hover-card-content" className={className}>
      {children}
    </div>
  ),
}));

afterEach(() => {
  cleanup();
});

describe("WorkoutPrice", () => {
  test("renders a Price label, prefers the student price, and lists explicit audience prices", () => {
    render(
      <WorkoutPrice
        priceStudent={12}
        priceStaff={18}
        priceExternal={25}
        priceExternalReduced={9}
      />,
    );

    expect(screen.getAllByText("Price").length).toBeGreaterThan(0);
    expect(screen.getAllByText("€12.00").length).toBeGreaterThan(0);
    expect(screen.getByText("Student")).toBeDefined();
    expect(screen.getByText("€18.00")).toBeDefined();
    expect(screen.getByText("External")).toBeDefined();
    expect(screen.getByText("External (reduced)")).toBeDefined();
  });

  test("falls back to the next available audience price when student price is missing", () => {
    render(
      <WorkoutPrice
        priceStudent={null}
        priceStaff={21}
        priceExternal={28}
        priceExternalReduced={null}
      />,
    );

    expect(screen.getAllByText("€21.00").length).toBeGreaterThan(0);
    expect(screen.queryByText("€-.00")).toBeNull();
  });
});

describe("getPrimaryWorkoutPrice", () => {
  test("uses the first available audience-specific price in fallback order", () => {
    expect(getPrimaryWorkoutPrice({
      priceStudent: null,
      priceStaff: null,
      priceExternal: 26,
      priceExternalReduced: 14,
    })).toBe(26);
  });
});

describe("getWorkoutPriceDetails", () => {
  test("returns explicit audience labels in display order", () => {
    expect(getWorkoutPriceDetails({
      priceStudent: 10,
      priceStaff: 15,
      priceExternal: 20,
      priceExternalReduced: 12,
    })).toEqual([
      { label: "Student", value: "€10.00" },
      { label: "Staff", value: "€15.00" },
      { label: "External", value: "€20.00" },
      { label: "External (reduced)", value: "€12.00" },
    ]);
  });
});
