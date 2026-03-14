import { describe, expect, test } from "vitest";
import { listSemestersForYear } from "@/lib/scrapers/year-expansion";

describe("CAU year expansion", () => {
  test("expands CAU year runs to winter of the given year and spring of the following year", () => {
    expect(listSemestersForYear("cau", 2025)).toEqual(["wi25", "sp26"]);
    expect(listSemestersForYear("cau-sport", 2025)).toEqual(["wi25", "sp26"]);
  });
});
