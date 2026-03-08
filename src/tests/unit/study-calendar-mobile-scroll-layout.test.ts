import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

describe("StudyCalendar mobile horizontal scroll layout", () => {
  test("keeps the time rail sticky only on desktop so mobile scroll moves the current-time marker and badge", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/home/StudyCalendar.tsx"),
      "utf8",
    );

    expect(source).toContain('className="w-12 shrink-0 border-r border-border bg-background/95 backdrop-blur z-30 flex flex-col relative lg:sticky lg:left-0"');
    expect(source).not.toContain('className="w-12 shrink-0 border-r border-border bg-background/95 backdrop-blur z-30 flex flex-col relative sticky left-0"');
  });
});
