import { afterEach, describe, expect, test, vi } from "vitest";

const loadCacheModule = async () => {
  const modulePath = "@/lib/scrapers/cau-blob-cache";
  return import(modulePath);
};

describe("CAU blob cache helper contract", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@vercel/blob");
    vi.restoreAllMocks();
  });

  test("builds semester and ModulDB cache keys", async () => {
    const cacheModule = await loadCacheModule();

    expect(cacheModule.semesterXmlKey("2026s")).toBe("cau/xml/2026s.xml");
    expect(cacheModule.modulDbXmlKey("infGAI-01a")).toBe("cau/moduldb/infGAI-01a.xml");
  });

  test("treats blob read failures as cache misses", async () => {
    vi.doMock("@vercel/blob", () => ({
      head: vi.fn().mockRejectedValue(new Error("missing")),
    }));

    const cacheModule = await loadCacheModule();

    await expect(cacheModule.readCachedText("cau/xml/2026s.xml")).resolves.toBeNull();
  });

  test("writes exact raw payloads back to blob storage", async () => {
    const putMock = vi.fn().mockResolvedValue({ url: "https://blob.example/cau/xml/2026s.xml" });
    vi.doMock("@vercel/blob", () => ({
      put: putMock,
      head: vi.fn(),
    }));

    const cacheModule = await loadCacheModule();

    await cacheModule.writeCachedText("cau/xml/2026s.xml", "<Lecture />");

    expect(putMock).toHaveBeenCalledWith("cau/xml/2026s.xml", "<Lecture />", expect.any(Object));
  });
});
