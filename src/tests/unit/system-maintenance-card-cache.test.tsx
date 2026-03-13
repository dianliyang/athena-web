import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { resetCachedJsonResourceCache } from "@/hooks/useCachedJsonResource";

const fetchMock = vi.fn();

vi.mock("@/actions/scrapers", () => ({
  runManualScraperAction: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    channel: () => ({
      on() {
        return this;
      },
      subscribe() {
        return {};
      },
    }),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe("SystemMaintenanceCard cache behavior", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    resetCachedJsonResourceCache();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      json: async () => ({
        items: [
          {
            id: 11,
            university: "MIT",
            semester: "2026",
            status: "success",
            job_type: "manual",
            triggered_by: "user",
            course_count: 12,
            duration_ms: 1000,
            error: null,
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  test("renders cached recent runs immediately and refreshes in the background", async () => {
    window.sessionStorage.setItem(
      "cc:cached-json:scraper-jobs",
      JSON.stringify({
        cachedAt: Date.now(),
        data: {
          items: [
            {
              id: 21,
              university: "Stanford",
              semester: "2026",
              status: "success",
              job_type: "manual",
              triggered_by: "user",
              course_count: 7,
              duration_ms: 800,
              error: null,
            },
          ],
        },
      }),
    );

    const { default: SystemMaintenanceCard } = await import("@/components/identity/SystemMaintenanceCard");

    render(<SystemMaintenanceCard />);

    expect(screen.getByText("Stanford")).toBeDefined();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/scraper-jobs/recent", { cache: "no-store" });
    });
  });
});
