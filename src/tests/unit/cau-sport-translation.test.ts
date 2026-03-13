import { describe, expect, test } from "vitest";
import { translateDE } from "@/lib/scrapers/cau-sport";

describe("CAUSport DE->EN translation", () => {
  test("translates exact matches, mixed phrases, and month names", () => {
    expect(translateDE("Schwimmen öff. Schwimmbetrieb")).toBe("Swimming Public Pool");
    expect(translateDE("Volleyball freies Spiel")).toBe("Volleyball Open Play");
    expect(translateDE("Klettern Klettertreff März")).toBe("Climbing Climbing Meetup March");
  });

  test("returns the same translated value across repeated calls", () => {
    expect(translateDE("Klettern Klettertreff März")).toBe("Climbing Climbing Meetup March");
    expect(translateDE("Klettern Klettertreff März")).toBe("Climbing Climbing Meetup March");
  });
});
