import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

type PreviewPayload = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

function first(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const v = typeof value === "string" ? value.trim() : "";
    if (v) return v;
  }
  return null;
}

function normalizeUrl(input: string): URL | null {
  try {
    const url = new URL(input);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".local")
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url") || "";
  const normalized = normalizeUrl(target);

  if (!normalized) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(normalized.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AthenaLinkPreview/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json(
        {
          url: normalized.toString(),
          title: normalized.hostname,
          description: null,
          image: null,
          siteName: normalized.hostname,
        } satisfies PreviewPayload,
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = first(
      $("meta[property='og:title']").attr("content"),
      $("meta[name='twitter:title']").attr("content"),
      $("title").text(),
    );

    const description = first(
      $("meta[property='og:description']").attr("content"),
      $("meta[name='twitter:description']").attr("content"),
      $("meta[name='description']").attr("content"),
    );

    const rawImage = first(
      $("meta[property='og:image']").attr("content"),
      $("meta[name='twitter:image']").attr("content"),
      $("meta[property='og:image:url']").attr("content"),
    );

    const image = rawImage ? new URL(rawImage, normalized).toString() : null;

    const siteName = first(
      $("meta[property='og:site_name']").attr("content"),
      normalized.hostname,
    );

    return NextResponse.json({
      url: normalized.toString(),
      title,
      description,
      image,
      siteName,
    } satisfies PreviewPayload);
  } catch {
    return NextResponse.json(
      {
        url: normalized.toString(),
        title: normalized.hostname,
        description: null,
        image: null,
        siteName: normalized.hostname,
      } satisfies PreviewPayload,
    );
  } finally {
    clearTimeout(timeout);
  }
}
