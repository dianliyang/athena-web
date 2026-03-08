import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

describe("dashboard page height layout", () => {
  test("courses page uses a content-height wrapper instead of a fixed-height shell", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/app/(dashboard)/courses/page.tsx"),
      "utf8",
    );

    expect(source).toContain('className="min-h-full w-full px-4 py-4"');
    expect(source).not.toContain('className="h-full min-h-0 flex flex-col px-4 pb-4"');
  });

  test("seminar and project page uses a content-height wrapper instead of a fixed-height shell", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/app/(dashboard)/projects-seminars/page.tsx"),
      "utf8",
    );

    expect(source).toContain('className="min-h-full w-full px-4 py-4"');
    expect(source).not.toContain('className="flex h-full min-h-0 flex-col px-4 pb-4"');
  });

  test("workouts page keeps a fixed-height shell for the list layout", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/app/(dashboard)/workouts/page.tsx"),
      "utf8",
    );

    expect(source).toContain('className="h-full flex flex-col gap-4 px-4 pb-4"');
    expect(source).toContain('className="flex-1 min-h-0"');
  });
});
