import { afterEach, describe, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { CAU } from "@/lib/scrapers/cau";
import * as cauBlobCache from "@/lib/scrapers/cau-blob-cache";

const encoder = new TextEncoder();

describe("CAU retrieve XML flow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("discovers XML export and returns normalized courses", async () => {
    const scraper = new CAU();
    const exportPage = readFileSync("src/tests/fixtures/cau/xml-export-page.html", "utf8");
    const xml = readFileSync("src/tests/fixtures/cau/data.xml", "utf8");
    vi.spyOn(cauBlobCache, "writeCachedText").mockResolvedValue();
    let callIndex = 0;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      callIndex += 1;

      if (callIndex === 1) {
        return new Response(encoder.encode(exportPage), { status: 200 });
      }

      if (callIndex === 2) {
        return new Response(encoder.encode(xml), { status: 200 });
      }

      if (url.includes("moduldb.informatik.uni-kiel.de/show.cgi?xml=")) {
        return new Response("", { status: 404 });
      }

      return new Response("", { status: 404 });
    });

    const courses = await scraper.retrieve();

    expect(fetchMock.mock.calls.length).toBeGreaterThan(2);
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(
      fetchMock.mock.calls.some(([input]) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        return url.includes("moduldb.informatik.uni-kiel.de/show.cgi?xml=");
      }),
    ).toBe(true);
    expect(courses.length).toBeGreaterThan(0);
    expect(courses.some((course) => course.courseCode === "Inf-EntEinSys")).toBe(true);
  });

  test("uses cached semester XML without hitting UnivIS when not forced", async () => {
    const scraper = new CAU();
    scraper.semester = "sp26";
    const xml = readFileSync("src/tests/fixtures/cau/data.xml", "utf8");

    const fetchPageSpy = vi.spyOn(scraper, "fetchPage");
    const readSpy = vi.spyOn(cauBlobCache, "readCachedText").mockResolvedValue(xml);
    const normalizeSpy = vi.spyOn(scraper as never, "normalizeXmlCourses");

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 404 }));

    const courses = await scraper.retrieve();

    expect(fetchPageSpy).not.toHaveBeenCalled();
    expect(readSpy).toHaveBeenCalledWith("cau/xml/2026s.xml");
    expect(
      fetchMock.mock.calls.some(([input]) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        return url.includes("univis.uni-kiel.de");
      }),
    ).toBe(false);
    expect(normalizeSpy).toHaveBeenCalledWith(expect.stringContaining("<?xml"));
    expect(courses.some((course) => course.courseCode === "Inf-EntEinSys")).toBe(true);
  });

  test("refetches and overwrites cached XML once when cached semester XML cannot be parsed", async () => {
    const scraper = new CAU();
    scraper.semester = "sp26";

    const exportPage = readFileSync("src/tests/fixtures/cau/xml-export-page.html", "utf8");
    const xml = readFileSync("src/tests/fixtures/cau/data.xml", "utf8");
    const readSpy = vi.spyOn(cauBlobCache, "readCachedText").mockResolvedValueOnce("not xml");
    const writeSpy = vi.spyOn(cauBlobCache, "writeCachedText").mockResolvedValue();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("univis.uni-kiel.de/form") && init?.method === "POST") {
        return new Response(encoder.encode(xml), { status: 200 });
      }

      if (url.includes("univis.uni-kiel.de/form")) {
        return new Response(encoder.encode(exportPage), { status: 200 });
      }

      if (url.includes("moduldb.informatik.uni-kiel.de/show.cgi?xml=")) {
        return new Response("", { status: 404 });
      }

      return new Response("", { status: 404 });
    });

    const courses = await scraper.retrieve();

    expect(readSpy).toHaveBeenCalledWith("cau/xml/2026s.xml");
    expect(writeSpy).toHaveBeenCalledWith(
      "cau/xml/2026s.xml",
      expect.stringContaining("<?xml"),
      expect.objectContaining({
        contentType: "application/xml; charset=utf-8",
      }),
    );
    expect(fetchMock.mock.calls.filter(([input]) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      return url.includes("univis.uni-kiel.de/form");
    }).length).toBe(2);
    expect(courses.some((course) => course.courseCode === "Inf-EntEinSys")).toBe(true);
  });

  test("uses cached ModulDB XML without hitting ModulDB when not forced", async () => {
    const xml = readFileSync("src/tests/fixtures/cau/data.xml", "utf8");
    const modulDbXml = readFileSync("src/tests/fixtures/cau/moduldb-inf-enteinsys.xml", "utf8");
    const scraper = new CAU();
    const parseSpy = vi.spyOn(scraper as never, "parseModulDbXml");
    const readSpy = vi.spyOn(cauBlobCache, "readCachedText").mockImplementation(async (key) => {
      if (key === "cau/moduldb/Inf-EntEinSys.xml") {
        return modulDbXml;
      }
      return null;
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("moduldb.informatik.uni-kiel.de/show.cgi?xml=")) {
        return new Response("", { status: 404 });
      }

      return new Response("", { status: 404 });
    });

    const courses = await scraper.parseXmlCoursesForTests(xml);
    const filteredCourses = courses.filter((course) => course.courseCode === "Inf-EntEinSys");
    const enriched = await (scraper as never).enrichCoursesWithModulDb(filteredCourses);

    expect(readSpy).toHaveBeenCalledWith("cau/moduldb/Inf-EntEinSys.xml");
    expect(
      fetchMock.mock.calls.some(([input]) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        return url.includes("moduldb.informatik.uni-kiel.de/show.cgi?xml=");
      }),
    ).toBe(false);
    expect(parseSpy).toHaveBeenCalledWith(expect.stringContaining("<modul"));
    expect(enriched).toHaveLength(filteredCourses.length);
  });

  test("refetches and overwrites cached ModulDB XML once when cached ModulDB payload cannot be parsed", async () => {
    const xml = readFileSync("src/tests/fixtures/cau/data.xml", "utf8");
    const modulDbXml = readFileSync("src/tests/fixtures/cau/moduldb-inf-enteinsys.xml", "utf8");
    const scraper = new CAU();
    const readSpy = vi.spyOn(cauBlobCache, "readCachedText").mockImplementation(async (key) => {
      if (key === "cau/moduldb/Inf-EntEinSys.xml") {
        return "not xml";
      }
      return null;
    });
    const writeSpy = vi.spyOn(cauBlobCache, "writeCachedText").mockResolvedValue();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("moduldb.informatik.uni-kiel.de/show.cgi?xml=Inf-EntEinSys")) {
        return new Response(modulDbXml, { status: 200 });
      }

      return new Response("", { status: 404 });
    });

    const courses = await scraper.parseXmlCoursesForTests(xml);
    const filteredCourses = courses.filter((course) => course.courseCode === "Inf-EntEinSys");
    const enriched = await (scraper as never).enrichCoursesWithModulDb(filteredCourses);

    expect(readSpy).toHaveBeenCalledWith("cau/moduldb/Inf-EntEinSys.xml");
    expect(writeSpy).toHaveBeenCalledWith(
      "cau/moduldb/Inf-EntEinSys.xml",
      expect.stringContaining("<modul"),
      expect.objectContaining({
        contentType: "application/xml; charset=utf-8",
      }),
    );
    expect(fetchMock.mock.calls.filter(([input]) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      return url.includes("moduldb.informatik.uni-kiel.de/show.cgi?xml=Inf-EntEinSys");
    }).length).toBe(1);
    expect(enriched.find((course) => course.courseCode === "Inf-EntEinSys")?.details).toEqual(
      expect.objectContaining({
        modulDbTeachingLanguage: expect.any(String),
      }),
    );
  });
});
