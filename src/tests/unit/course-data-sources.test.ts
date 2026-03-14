import { describe, expect, test } from "vitest";
import { readCourseDataSources, readCourseDescriptionSections } from "@/lib/course-data-sources";

describe("course data source helpers", () => {
  test("reads normalized source badges and description sections from details", () => {
    const details = {
      dataSources: [
        { id: "univis", label: "UnivIS" },
        { id: "moduldb", label: "ModulDB", coverage: ["module"] },
      ],
      descriptionSections: [
        {
          key: "summary",
          label: "Summary",
          text: "Structured module summary",
          sourceId: "moduldb",
          sourceLabel: "ModulDB",
        },
      ],
    };

    expect(readCourseDataSources(details)).toEqual([
      { id: "univis", label: "UnivIS", coverage: undefined },
      { id: "moduldb", label: "ModulDB", coverage: ["module"] },
    ]);
    expect(readCourseDescriptionSections(details)).toEqual([
      {
        key: "summary",
        label: "Summary",
        text: "Structured module summary",
        sourceId: "moduldb",
        sourceLabel: "ModulDB",
      },
    ]);
  });
});
