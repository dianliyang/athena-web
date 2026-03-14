import { describe, expect, test } from "vitest";
import type { Course } from "@/lib/scrapers/types";
import {
  dedupeScrapedCoursesByCode,
  defaultImportedCourseInternalValue,
  isCauProjectSeminarCourse,
} from "@/lib/supabase/server";

describe("CAU course persistence rules", () => {
  test("defaults imported CAU courses to internal", () => {
    const cauCourse: Course = {
      university: "CAU Kiel",
      courseCode: "infEOR-01a",
      title: "Einfuhrung in Operations Research",
    };

    const externalCourse: Course = {
      university: "MIT",
      courseCode: "6.001",
      title: "Intro",
    };

    expect(defaultImportedCourseInternalValue(cauCourse)).toBe(true);
    expect(defaultImportedCourseInternalValue(externalCourse)).toBe(false);
  });

  test("routes CAU seminars and projects away from the courses table", () => {
    const seminar: Course = {
      university: "CAU Kiel",
      courseCode: "infSemDaSci-01a",
      title: "Master Seminar - Data Science",
      details: {
        category: "Seminar",
        normalizedType: "Seminar",
      },
    };

    const project: Course = {
      university: "CAU Kiel",
      courseCode: "infFPInS",
      title: "Forschungsprojekt - Intelligente Systeme",
      category: "Advanced Project",
      details: {
        category: "Advanced Project",
      },
    };

    const lecture: Course = {
      university: "CAU Kiel",
      courseCode: "Inf-EntEinSys",
      title: "Embedded Real-Time Systems",
      details: {
        category: "Compulsory elective modules in Computer Science",
        normalizedType: "Lecture",
      },
    };

    expect(isCauProjectSeminarCourse(seminar)).toBe(true);
    expect(isCauProjectSeminarCourse(project)).toBe(true);
    expect(isCauProjectSeminarCourse(lecture)).toBe(false);
  });

  test("deduplicates scraped rows by university and course code before upsert", () => {
    const first: Course = {
      university: "CAU Kiel",
      courseCode: "Inf-EntEinSys",
      title: "Embedded Real-Time Systems",
      semesters: [{ term: "Winter", year: 2025 }],
      resources: ["https://example.com/one"],
    };

    const second: Course = {
      university: "CAU Kiel",
      courseCode: "Inf-EntEinSys",
      title: "Embedded Real-Time Systems",
      semesters: [{ term: "Spring", year: 2026 }],
      resources: ["https://example.com/two"],
    };

    const deduped = dedupeScrapedCoursesByCode([first, second]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0].semesters).toEqual([
      { term: "Winter", year: 2025 },
      { term: "Spring", year: 2026 },
    ]);
    expect(deduped[0].resources).toEqual([
      "https://example.com/one",
      "https://example.com/two",
    ]);
  });
});
