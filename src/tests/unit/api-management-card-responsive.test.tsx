import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { resetCachedJsonResourceCache } from "@/hooks/useCachedJsonResource";

const fetchMock = vi.fn();

describe("ApiManagementCard responsive layout", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    resetCachedJsonResourceCache();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      json: async () => ({
        keys: [
          {
            id: 1,
            name: "Primary",
            keyPrefix: "ak_live",
            isActive: true,
            isReadOnly: false,
            requestsLimit: 1000,
            requestsUsed: 120,
            lastUsedAt: "2026-03-08T21:44:55.000Z",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 640,
    });
  });

  test("uses mobile cards for API keys and keeps summary stats on one row", async () => {
    const { default: ApiManagementCard } = await import("@/components/identity/ApiManagementCard");

    render(<ApiManagementCard />);

    await waitFor(() => {
      expect(screen.getByTestId("api-keys-mobile-cards")).toBeDefined();
    });

    expect(screen.getByTestId("api-key-card-1")).toBeDefined();
    expect(screen.queryByText("API Key")).toBeNull();
    expect(screen.getAllByTestId("api-stats-row").at(-1)?.className).toContain("overflow-x-auto");
  });

  test("keeps the summary stats horizontally scrollable with icon labels", async () => {
    const { default: ApiManagementCard } = await import("@/components/identity/ApiManagementCard");

    render(<ApiManagementCard />);

    await waitFor(() => {
      expect(screen.getAllByTestId("api-stats-row").at(-1)).toBeDefined();
    });

    expect(screen.getAllByTestId("api-stats-row").at(-1)?.className).toContain("overflow-x-auto");
    expect(screen.getAllByTestId("api-total-keys-icon").at(-1)).toBeDefined();
    expect(screen.getAllByTestId("api-active-keys-icon").at(-1)).toBeDefined();
    expect(screen.getAllByTestId("api-requests-used-icon").at(-1)).toBeDefined();
  });

  test("renders cached keys immediately and refreshes in the background", async () => {
    window.sessionStorage.setItem(
      "cc:cached-json:api-keys",
      JSON.stringify({
        cachedAt: Date.now(),
        data: {
          keys: [
            {
              id: 7,
              name: "Cached Key",
              keyPrefix: "ak_cached",
              isActive: true,
              isReadOnly: false,
              requestsLimit: 250,
              requestsUsed: 42,
              lastUsedAt: "2026-03-09T08:00:00.000Z",
            },
          ],
        },
      }),
    );

    const { default: ApiManagementCard } = await import("@/components/identity/ApiManagementCard");

    render(<ApiManagementCard />);

    expect(screen.getByText("Cached Key")).toBeDefined();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/settings/api-key", { cache: "no-store" });
    });
  });
});
