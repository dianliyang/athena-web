import { head, put } from "@vercel/blob";

const DEFAULT_CONTENT_TYPE = "text/plain; charset=utf-8";
const DEFAULT_BLOB_ACCESS = process.env.CAU_BLOB_ACCESS === "private" ? "private" : "public";

export function semesterXmlKey(semester: string): string {
  return `cau/xml/${semester}.xml`;
}

export function modulDbXmlKey(moduleCode: string): string {
  return `cau/moduldb/${moduleCode}.xml`;
}

export async function readCachedText(pathname: string): Promise<string | null> {
  try {
    const metadata = await head(pathname);
    const response = await fetch(metadata.url);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

export async function writeCachedText(
  pathname: string,
  payload: string,
  options?: { contentType?: string },
): Promise<void> {
  try {
    await put(pathname, payload, {
      access: DEFAULT_BLOB_ACCESS,
      addRandomSuffix: false,
      contentType: options?.contentType || DEFAULT_CONTENT_TYPE,
    });
  } catch (error) {
    console.error(`[cau-blob-cache] Failed to write ${pathname}:`, error);
  }
}
