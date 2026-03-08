import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

describe("PWA icon asset paths", () => {
  test("manifest and service worker use concrete icon files in public/icons", () => {
    const manifest = fs.readFileSync(path.join(process.cwd(), "public/manifest.json"), "utf8");
    const serviceWorker = fs.readFileSync(path.join(process.cwd(), "public/sw.js"), "utf8");

    expect(manifest).toContain('"/icons/icon-192x192.png"');
    expect(manifest).toContain('"/icons/icon-512x512.png"');
    expect(manifest).toContain('"/icons/apple-touch-icon.png"');
    expect(serviceWorker).toContain("'/icons/icon-192x192.png'");
    expect(serviceWorker).toContain("'/icons/icon-512x512.png'");
  });

  test("icon generation and layout apple metadata both derive from athena.svg outputs", () => {
    const generator = fs.readFileSync(
      path.join(process.cwd(), "scripts/generate-icons.ts"),
      "utf8",
    );
    const layout = fs.readFileSync(
      path.join(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );

    expect(generator).toContain("public/athena.svg");
    expect(generator).toContain("apple-touch-icon.png");
    expect(layout).toContain('/icons/apple-touch-icon.png');
    expect(layout).not.toContain('/apple-touch-icon"');
  });
});
