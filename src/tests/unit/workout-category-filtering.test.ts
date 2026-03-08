import { describe, expect, test } from "vitest";
import type { Workout } from "@/types";
import { buildVisibleWorkoutCategoryState } from "@/lib/workout-category-filtering";

function createWorkout(overrides: Partial<Workout>): Workout {
  return {
    id: 1,
    source: "CAU Kiel Sportzentrum",
    courseCode: "SP-001",
    category: "Swimming",
    categoryEn: "Swimming",
    title: "Yoga",
    titleEn: "Yoga",
    dayOfWeek: "Mon",
    startTime: "10:00:00",
    endTime: "11:00:00",
    location: "Hall A",
    locationEn: "Hall A",
    instructor: null,
    startDate: null,
    endDate: null,
    priceStudent: 10,
    priceStaff: null,
    priceExternal: null,
    priceExternalReduced: null,
    bookingStatus: "available",
    bookingUrl: null,
    url: null,
    semester: "Winter 2025",
    details: null,
    ...overrides,
  };
}

describe("buildVisibleWorkoutCategoryState", () => {
  test("omits categories whose choices are only fully booked or expired", () => {
    const items: Workout[] = [
      createWorkout({ id: 1, categoryEn: "Swimming", bookingStatus: "fully_booked" }),
      createWorkout({ id: 2, categoryEn: "Swimming", bookingStatus: "expired", title: "Swim 2", titleEn: "Swim 2" }),
      createWorkout({ id: 3, categoryEn: "Yoga", bookingStatus: "available", category: "Yoga", title: "Yoga", titleEn: "Yoga" }),
    ];

    const state = buildVisibleWorkoutCategoryState(items, [], "");

    expect(state.categoryGroups.map((group) => group.category)).toEqual(["Yoga"]);
    expect(state.selectedCategory).toBe("Yoga");
    expect(state.items).toHaveLength(1);
    expect(state.items[0].categoryEn).toBe("Yoga");
  });

  test("keeps categories visible when waitlist is the remaining option", () => {
    const items: Workout[] = [
      createWorkout({ id: 1, categoryEn: "Swimming", bookingStatus: "waitlist" }),
      createWorkout({ id: 2, categoryEn: "Yoga", bookingStatus: "available", category: "Yoga", title: "Yoga", titleEn: "Yoga" }),
    ];

    const state = buildVisibleWorkoutCategoryState(items, [], "Swimming");

    expect(state.categoryGroups.map((group) => group.category)).toEqual(["Swimming", "Yoga"]);
    expect(state.selectedCategory).toBe("Swimming");
    expect(state.items).toHaveLength(1);
    expect(state.items[0].bookingStatus).toBe("waitlist");
  });

  test("falls back to the first visible category when the requested one is hidden", () => {
    const items: Workout[] = [
      createWorkout({ id: 1, categoryEn: "Swimming", bookingStatus: "fully_booked" }),
      createWorkout({ id: 2, categoryEn: "Running", bookingStatus: "see_text", category: "Running", title: "Run", titleEn: "Run" }),
    ];

    const state = buildVisibleWorkoutCategoryState(items, [], "Swimming");

    expect(state.categoryGroups.map((group) => group.category)).toEqual(["Running"]);
    expect(state.selectedCategory).toBe("Running");
    expect(state.items).toHaveLength(1);
    expect(state.items[0].categoryEn).toBe("Running");
  });
});
