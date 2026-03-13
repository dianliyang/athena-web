import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import UsageStatisticsPanel from "@/app/(dashboard)/settings/usage/UsageStatisticsPanel";
import { resetCachedJsonResourceCache } from "@/hooks/useCachedJsonResource";

const statsPayload = {
  totals: { requests: 12, tokens_input: 1000, tokens_output: 2000, cost_usd: 1.23 },
  byFeature: { chat: { requests: 8, cost_usd: 0.7 } },
  byModel: { "gpt-test": { requests: 8, cost_usd: 0.7 } },
  recentTotals: { requests: 4, cost_usd: 0.2 },
  recentResponses: [],
  daily: { "2026-03-01": { requests: 2, cost_usd: 0.1 } },
};

const zeroRecentStatsPayload = {
  ...statsPayload,
  recentTotals: { requests: 0, cost_usd: 0 },
};

describe("UsageStatisticsPanel", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    resetCachedJsonResourceCache();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => statsPayload,
      }),
    );
  });

  afterEach(() => {
    cleanup();
  });

  test("does not add extra horizontal page padding at the panel root", async () => {
    const { container } = render(<UsageStatisticsPanel />);

    await waitFor(() => {
      expect(screen.getAllByText("Usage Statistics").length).toBeGreaterThan(0);
    });

    const root = container.firstElementChild as HTMLElement;

    expect(root.className).toContain("space-y-3");
    expect(root.className).not.toContain("px-4");
  });

  test("uses a scrollable summary row with icons and avoids redundant zero-value recent text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => zeroRecentStatsPayload,
    }));

    render(<UsageStatisticsPanel />);

    await waitFor(() => {
      expect(screen.getByText("Usage Statistics")).toBeDefined();
    });

    expect(screen.getAllByTestId("usage-summary-row").at(-1)?.className).toContain("overflow-x-auto");
    expect(screen.getAllByTestId("usage-summary-row").at(-1)?.className).toContain("gap-4");
    expect(screen.getAllByTestId("usage-summary-row").at(-1)?.textContent).toContain("Requests");
    const summaryCards = screen.getAllByTestId("usage-summary-row").at(-1)?.querySelectorAll(":scope > div") || [];
    expect(Array.from(summaryCards).every((card) => card.className.includes("shrink-0"))).toBe(true);
    expect(screen.getAllByTestId("usage-stat-requests-icon").at(-1)).toBeDefined();
    expect(screen.getAllByTestId("usage-stat-input-tokens-icon").at(-1)).toBeDefined();
    expect(screen.getAllByText("in last 7 days").at(-1)).toBeDefined();
    expect(screen.queryByText("0 in last 7 days")).toBeNull();
    expect(screen.queryByText("$0.0000 in last 7 days")).toBeNull();
  });

  test("renders cached usage stats immediately and refreshes in the background", async () => {
    window.sessionStorage.setItem(
      "cc:cached-json:usage-statistics",
      JSON.stringify({
        cachedAt: Date.now(),
        data: {
          ...statsPayload,
          totals: {
            ...statsPayload.totals,
            requests: 99,
          },
        },
      }),
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => statsPayload,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<UsageStatisticsPanel />);

    expect(screen.getByText("99")).toBeDefined();
    expect(screen.queryByRole("status")).toBeNull();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/ai/usage/stats", { cache: "no-store" });
    });
  });
});
