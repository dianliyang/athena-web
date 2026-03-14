import { describe, expect, test } from "vitest";
import { CAU } from "@/lib/scrapers/cau";

describe("CAU semester parameter mapping", () => {
  test("maps plain years to winter terms without inflating the year", () => {
    const scraper = new CAU();

    scraper.semester = "2026";
    expect(scraper.getSemesterParam()).toBe("2026w");

    scraper.semester = "2025";
    expect(scraper.getSemesterParam()).toBe("2025w");
  });

  test("builds the marked lecture listing URL for UnivIS discovery", async () => {
    const scraper = new CAU();
    scraper.semester = "SP26";

    const links = await scraper.links();

    expect(links).toHaveLength(1);
    expect(links[0]).toContain("marked=__ALL");
    expect(links[0]).toContain("ref=tlecture");
    expect(links[0]).toContain("sem=2026s");
  });
});
