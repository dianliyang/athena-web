import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/external/courses/[course_code]/plan-input/route";

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/server";

function makeMock(resolvedValue: { data: unknown; error: unknown }) {
  const mockMaybeSingle = vi.fn().mockResolvedValue(resolvedValue);
  const mockLimit = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
  const mockEq = vi.fn().mockReturnValue({ limit: mockLimit });
  const mockNeq = vi.fn().mockReturnValue({ eq: mockEq });
  const mockSelect = vi.fn().mockReturnValue({ neq: mockNeq });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
  return { mockFrom, mockEq, mockMaybeSingle };
}

describe("GET /api/external/courses/[course_code]/plan-input", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.INTERNAL_API_KEY = "test-internal-key";
  });

  it("returns 400 for invalid mode", async () => {
    const req = new NextRequest("http://localhost:3000/api/external/courses/CS-101/plan-input?mode=wrong", {
      headers: { "x-api-key": "test-internal-key" },
    });

    const res = await GET(req, { params: Promise.resolve({ course_code: "CS-101" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("Invalid mode");
  });

  it("fresh mode strips existing plan signals while keeping minimal sources", async () => {
    const mockData = {
      id: 1,
      university: "CAU Kiel",
      course_code: "CS-101",
      title: "Course 1",
      description: "desc",
      subdomain: "ai",
      url: "https://example.com/course",
      resources: ["https://example.com/resource"],
      course_fields: [{ fields: { name: "Computer Science" } }],
      study_plans: [{ start_date: "2026-03-01", end_date: "2026-05-20", updated_at: "2026-03-01T12:00:00.000Z" }],
      course_syllabi: [
        {
          source_url: "https://example.com/syllabus",
          schedule: [
            {
              date: "2026-03-10",
              title: "Lecture 1",
              readings: [{ title: "Read Ch1", due_on: "2026-03-11" }],
            },
          ],
        },
      ],
      course_assignments: [
        {
          kind: "assignment",
          label: "Problem Set 1",
          due_on: "2026-03-15",
          url: null,
          description: null,
          source_sequence: null,
          source_row_date: null,
        },
      ],
      user_courses: [{ status: "in_progress" }],
    };

    const { mockFrom, mockEq, mockMaybeSingle } = makeMock({ data: mockData, error: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createAdminClient as any).mockReturnValue({ from: mockFrom });

    const req = new NextRequest("http://localhost:3000/api/external/courses/CS-101/plan-input?mode=fresh", {
      headers: { "x-api-key": "test-internal-key" },
    });

    const res = await GET(req, { params: Promise.resolve({ course_code: "CS-101" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.mode).toBe("fresh");
    expect(body.planInput.planningWindow).toEqual({
      startDate: null,
      endDate: null,
      source: "mode_fresh",
    });
    expect(body.planInput.sources).toEqual({
      primaryUrl: "https://example.com/course",
      resources: ["https://example.com/resource"],
      syllabusSourceUrl: "https://example.com/syllabus",
    });
    expect(body.planInput.signals).toEqual({
      lectures: [],
      tasks: [],
    });
    expect(body.planInput.counts).toEqual({
      scheduleRows: 0,
      assignments: 0,
      normalizedTasks: 0,
    });
    expect(body.planInput.existingData).toEqual({
      hasStudyPlan: true,
      scheduleRows: 1,
      assignments: 1,
      normalizedTasks: 2,
    });

    expect(mockFrom).toHaveBeenCalledWith("courses");
    expect(mockEq).toHaveBeenCalledWith("course_code", "CS-101");
    expect(mockMaybeSingle).toHaveBeenCalledOnce();
  });
});
