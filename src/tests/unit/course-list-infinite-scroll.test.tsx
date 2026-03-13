import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import CourseList from "@/components/home/CourseList";

const searchParams = new URLSearchParams("");
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    prefetch,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => {
    void prefetch;
    return (
      <a href={typeof href === "string" ? href : "#"} {...props}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/components/common/AppToastProvider", () => ({
  useAppToast: () => ({
    showToast: vi.fn(),
  }),
}));

vi.mock("@/actions/courses", () => ({
  toggleCourseEnrollmentAction: vi.fn(),
}));

vi.mock("@/components/home/CourseListHeader", () => ({
  default: () => <div data-testid="course-list-header" />,
}));

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: vi.fn(({ count, estimateSize }) => ({
    getVirtualItems: () => Array.from({ length: count }, (_, index) => ({
      index,
      start: index * estimateSize(),
      size: estimateSize(),
      key: index,
    })),
    getTotalSize: () => count * estimateSize(),
    scrollToIndex: vi.fn(),
    scrollToOffset: vi.fn(),
  })),
}));

let observerCallback: (entries: IntersectionObserverEntry[]) => void;

class MockIntersectionObserver {
  constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
    observerCallback = callback;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

function triggerIntersection(isIntersecting: boolean) {
  act(() => {
    observerCallback([{ isIntersecting }] as IntersectionObserverEntry[]);
  });
}

function stubScrollMetrics(element: HTMLElement, metrics: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}) {
  Object.defineProperty(element, "scrollTop", {
    configurable: true,
    writable: true,
    value: metrics.scrollTop,
  });
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    value: metrics.scrollHeight,
  });
  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    value: metrics.clientHeight,
  });
  // Trigger scroll event to update virtualizer
  fireEvent.scroll(element);
}

describe("CourseList infinite scroll", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1280,
    });
    window.localStorage.setItem("courseViewMode", "list");
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  test("does not request the same next page more than once while a load is already in flight", async () => {
    let resolveFetch: ((value: Response) => void) | null = null;
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve as (value: Response) => void;
        }),
    );

    render(
      <CourseList
        initialCourses={[
          {
            id: 1,
            title: "Algorithms",
            courseCode: "CS-101",
            university: "Test U",
            url: "https://example.com/1",
            description: "Intro course",
            popularity: 1,
            isHidden: false,
            fields: [],
            semesters: ["Spring 2026"],
          },
        ]}
        totalPages={3}
        currentPage={1}
        perPage={20}
        initialEnrolledIds={[]}
        dict={{} as never}
        filterUniversities={[]}
        filterSemesters={[]}
      />,
    );

    await act(async () => {
      triggerIntersection(true);
      triggerIntersection(true);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/courses?page=2&size=20&q=&sort=title&enrolled=false&universities=&levels=&semesters=");

    await act(async () => {
      resolveFetch?.({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 2,
              title: "Data Structures",
              courseCode: "CS-102",
              university: "Test U",
              url: "https://example.com/2",
              description: "Second course",
              popularity: 1,
              isHidden: false,
              fields: [],
              semesters: ["Spring 2026"],
            },
          ],
        }),
      } as Response);
    });
  });

  test("does not auto-request every remaining page after the first append while the sentinel stays visible", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 2,
              title: "Data Structures",
              courseCode: "CS-102",
              university: "Test U",
              url: "https://example.com/2",
              description: "Second course",
              popularity: 1,
              isHidden: false,
              fields: [],
              semesters: ["Spring 2026"],
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      } as Response);

    const view = render(
      <CourseList
        initialCourses={[
          {
            id: 1,
            title: "Algorithms",
            courseCode: "CS-101",
            university: "Test U",
            url: "https://example.com/1",
            description: "Intro course",
            popularity: 1,
            isHidden: false,
            fields: [],
            semesters: ["Spring 2026"],
          },
        ]}
        totalPages={3}
        currentPage={1}
        perPage={20}
        initialEnrolledIds={[]}
        dict={{} as never}
        filterUniversities={[]}
        filterSemesters={[]}
      />,
    );

    await act(async () => {
      triggerIntersection(true);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(view.getAllByText("Data Structures").length).toBeGreaterThan(0);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("loads the next page when the sentinel is already visible and the list cannot scroll yet", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 2,
            title: "Data Structures",
            courseCode: "CS-102",
            university: "Test U",
            url: "https://example.com/2",
            description: "Second course",
            popularity: 1,
            isHidden: false,
            fields: [],
            semesters: ["Spring 2026"],
          },
        ],
      }),
    } as Response);

    render(
      <CourseList
        initialCourses={[
          {
            id: 1,
            title: "Algorithms",
            courseCode: "CS-101",
            university: "Test U",
            url: "https://example.com/1",
            description: "Intro course",
            popularity: 1,
            isHidden: false,
            fields: [],
            semesters: ["Spring 2026"],
          },
        ]}
        totalPages={3}
        currentPage={1}
        perPage={20}
        initialEnrolledIds={[]}
        dict={{} as never}
        filterUniversities={[]}
        filterSemesters={[]}
      />,
    );

    // Bootstrap load triggered by visible sentinel
    await act(async () => {
      triggerIntersection(true);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/courses?page=2&size=20&q=&sort=title&enrolled=false&universities=&levels=&semesters=");
  });

  test("does not keep auto-requesting more pages when the list remains non-scrollable after the bootstrap load", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 2,
              title: "Data Structures",
              courseCode: "CS-102",
              university: "Test U",
              url: "https://example.com/2",
              description: "Second course",
              popularity: 1,
              isHidden: false,
              fields: [],
              semesters: ["Spring 2026"],
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 3,
              title: "Databases",
              courseCode: "CS-103",
              university: "Test U",
              url: "https://example.com/3",
              description: "Third course",
              popularity: 1,
              isHidden: false,
              fields: [],
              semesters: ["Spring 2026"],
            },
          ],
        }),
      } as Response);

    render(
      <CourseList
        initialCourses={[
          {
            id: 1,
            title: "Algorithms",
            courseCode: "CS-101",
            university: "Test U",
            url: "https://example.com/1",
            description: "Intro course",
            popularity: 1,
            isHidden: false,
            fields: [],
            semesters: ["Spring 2026"],
          },
        ]}
        totalPages={5}
        currentPage={1}
        perPage={20}
        initialEnrolledIds={[]}
        dict={{} as never}
        filterUniversities={[]}
        filterSemesters={[]}
      />,
    );

    await act(async () => {
      triggerIntersection(true);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("loads more in grid mode when the virtualized range nears the loaded tail", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 30,
            title: "Distributed Systems",
            courseCode: "CS-130",
            university: "Test U",
            url: "https://example.com/30",
            description: "Grid next page",
            popularity: 1,
            isHidden: false,
            fields: [],
            semesters: ["Spring 2026"],
          },
        ],
      }),
    } as Response);

    window.localStorage.setItem("courseViewMode", "grid");

    const initialCourses = Array.from({ length: 29 }, (_, index) => ({
      id: index + 1,
      title: `Course ${index + 1}`,
      courseCode: `CS-${index + 1}`,
      university: "Test U",
      url: `https://example.com/${index + 1}`,
      description: "Grid course",
      popularity: 1,
      isHidden: false,
      fields: [],
      semesters: ["Spring 2026"],
    }));

    const view = render(
      <CourseList
        initialCourses={initialCourses}
        totalPages={3}
        currentPage={1}
        perPage={20}
        initialEnrolledIds={[]}
        dict={{} as never}
        filterUniversities={[]}
        filterSemesters={[]}
      />,
    );

    await act(async () => {
      triggerIntersection(true);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/courses?page=2&size=20&q=&sort=title&enrolled=false&universities=&levels=&semesters=");

    await waitFor(() => {
      expect(view.getAllByText("Distributed Systems").length).toBeGreaterThan(0);
    });
  });
});
