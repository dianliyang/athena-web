import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";

import PWARegister from "@/components/PWARegister";

describe("PWARegister", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    const register = vi.fn().mockResolvedValue({
      scope: "/",
      update: vi.fn(),
    });

    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        register,
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  test("does not register service worker in development", async () => {
    process.env.NODE_ENV = "development";

    render(<PWARegister />);

    await waitFor(() => {
      expect(window.navigator.serviceWorker.register).not.toHaveBeenCalled();
    });
  });

  test("registers service worker in production", async () => {
    process.env.NODE_ENV = "production";

    render(<PWARegister />);

    await waitFor(() => {
      expect(window.navigator.serviceWorker.register).toHaveBeenCalledWith("/sw.js");
    });
  });
});
