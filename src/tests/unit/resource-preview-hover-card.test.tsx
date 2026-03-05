import React from "react";
import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ResourcePreviewHoverCard } from "@/components/courses/CourseDetailContent";

vi.mock("next/image", () => ({
  default: ({ unoptimized: _unoptimized, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) => (
    <img {...props} />
  ),
}));

vi.mock("@/components/ui/hover-card", () => ({
  HoverCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  HoverCardTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  HoverCardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="hover-card-content" className={className}>
      {children}
    </div>
  ),
}));

describe("ResourcePreviewHoverCard", () => {
  test("shows the copy action in the header and invokes the copy handler", () => {
    const onCopy = vi.fn();

    render(
      <ResourcePreviewHoverCard
        url="https://example.com/resource"
        previewBlocked={false}
        copied={false}
        onPreviewBlocked={vi.fn()}
        onCopy={onCopy}
      />,
    );

    expect(screen.getByText("Website Preview")).toBeDefined();
    expect(screen.getByRole("button", { name: "Copy resource URL" })).toBeDefined();
    expect(screen.queryByRole("button", { name: /open/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Copy resource URL" }));

    expect(onCopy).toHaveBeenCalledTimes(1);
  });
});
