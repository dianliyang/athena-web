import React from "react";
import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import WorkoutSidebar from "@/components/workouts/WorkoutSidebar";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams("filters=open&provider=CAU%20Kiel%20Sportzentrum"),
}));

describe("WorkoutSidebar provider filter", () => {
  test("writes the selected provider into the shareable URL", () => {
    render(
      <WorkoutSidebar
        providers={[
          { name: "CAU Kiel Sportzentrum", count: 12 },
          { name: "Urban Apes", count: 2 },
        ]}
        categories={[{ name: "Bouldering", count: 2 }]}
        statuses={[{ name: "available", count: 14 }]}
        dict={{} as never}
      />,
    );

    fireEvent.click(screen.getByText("Urban Apes"));

    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("provider=Urban+Apes"),
      { scroll: false },
    );
  });
});
