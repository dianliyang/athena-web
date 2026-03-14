import { describe, expect, test } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("projects seminars table layout", () => {
  test("uses fixed table layout so long titles can ellipsize", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/projects-seminars/table/data-table.tsx"),
      "utf8",
    );

    expect(source).toContain('<Table className="table-fixed">');
  });

  test("keeps the S&P title cell overflow-clipped with truncate styling", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/projects-seminars/table/columns.tsx"),
      "utf8",
    );

    expect(source).toContain('className="flex min-h-10 min-w-0 max-w-full flex-col justify-center overflow-hidden"');
    expect(source).toContain('className="block max-w-full truncate hover:text-black transition-colors"');
  });
});
