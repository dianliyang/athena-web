import { describe, expect, test } from "vitest";
import { parseWorkoutDateForDb } from "@/lib/supabase/server";

describe("parseWorkoutDateForDb", () => {
  test("keeps ISO dates from scraped planned-date segments", () => {
    expect(parseWorkoutDateForDb("2026-01-10", "Current Period")).toBe("2026-01-10");
    expect(parseWorkoutDateForDb("2026-03-28", "Current Period")).toBe("2026-03-28");
  });

  test("parses short german dates using semester context", () => {
    expect(parseWorkoutDateForDb("27.10.", "Winter 2025/26")).toBe("2025-10-27");
    expect(parseWorkoutDateForDb("27.01.", "Winter 2025/26")).toBe("2026-01-27");
  });

  test("parses full german dates without semester context", () => {
    expect(parseWorkoutDateForDb("10.01.2026", null)).toBe("2026-01-10");
  });
});
