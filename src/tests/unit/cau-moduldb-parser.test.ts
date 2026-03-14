import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { CAU } from "@/lib/scrapers/cau";

describe("CAU ModulDB parser", () => {
  test("parses ModulDB XML into enrichment metadata", () => {
    const xml = readFileSync("src/tests/fixtures/cau/moduldb-inf-enteinsys.xml", "utf8");
    const scraper = new CAU();

    const parsed = scraper.parseModulDbXmlForTests(xml);

    expect(parsed).toEqual(
      expect.objectContaining({
        moduleCode: "Inf-EntEinSys",
        title: "Embedded Real-Time Systems",
        responsible: "Prof. Dr. Reinhard von Hanxleden",
        ects: 8,
        workloadText: "60 h lectures, 30 h exercises, 150 h self studies",
        teachingLanguage: "Englisch",
        description: "A cell phone that transmits voice signals correctly, but with too much delay, is unsatisfactory.",
        learningGoals: "Students understand the fundamentals of embedded/real-time systems.",
        contents: "Model-based designConcurrency and scheduling",
        prerequisites: "Mathematical knowledge, programming experience, firm knowledge in C and Java.",
        assessment: "The grade is determined by a final written exam.",
        teachingMethods: "Lectures, weekly exercises, software development.",
        applicability: "This module can be used for M.Sc. Informatik.",
        notes: "The primary script for class is the Lee/Seshia book.",
        pageUrl: "https://moduldb.informatik.uni-kiel.de/show.cgi?mod=Inf-EntEinSys",
      }),
    );

    expect(parsed?.unitsBreakdown).toEqual([
      { type: "V", sws: 4 },
      { type: "UE", sws: 2 },
    ]);
    expect(parsed?.resourceUrls).toContain("https://moduldb.informatik.uni-kiel.de/show.cgi?mod=Inf-EntEinSys");
    expect(parsed?.resourceUrls).toContain("http://www.rtsys.informatik.uni-kiel.de/en/teaching/overview");
    expect(parsed?.resourceUrls).toContain("https://ptolemy.berkeley.edu/books/leeseshia/");
    expect(parsed?.semesters).toEqual([{ term: "Spring", year: 2026 }]);
  });
});
