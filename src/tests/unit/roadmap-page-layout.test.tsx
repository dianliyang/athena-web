import React from "react";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  getUser: vi.fn(async () => ({ id: "user-1" })),
  createClient: vi.fn(),
  mapCourseFromRow: vi.fn(),
}));

vi.mock("@/actions/language", () => ({
  getLanguage: vi.fn(async () => "en"),
}));

vi.mock("@/lib/dictionary", () => ({
  getDictionary: vi.fn(async () => ({
    dashboard: {
      identity: { user_not_found: "User not found" },
      login: { title: "Login" },
    },
  })),
}));

describe("Roadmap page layout", () => {
  test("uses a content-height wrapper so the sticky header can remain pinned for the whole page", async () => {
    const roadmapPageModule = await import("@/app/(dashboard)/roadmap/page");
    const page = await roadmapPageModule.default();
    const classes = String(page.props.className).split(/\s+/);

    expect(React.isValidElement(page)).toBe(true);
    expect(classes).toContain("min-h-full");
    expect(classes).not.toContain("h-full");
  });
});
