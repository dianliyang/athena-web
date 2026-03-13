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
      createWorkout({ id: 3, category: "Yoga", categoryEn: "Yoga", bookingStatus: "available", title: "Yoga", titleEn: "Yoga" }),
    ];

    const state = buildVisibleWorkoutCategoryState(items, [], "", "");

    expect(state.categoryGroups.map((group) => group.category)).toEqual(["Yoga"]);
    expect(state.selectedCategory).toBe("Yoga");
    expect(state.items).toHaveLength(1);
    expect(state.items[0].categoryEn).toBe("Yoga");
  });

  test("keeps multiple raw choices visible within one category group even when titles match", () => {
    const items: Workout[] = [
      createWorkout(({
        id: 1,
        category: "Schwimmen öff. Schwimmbetrieb",
        categoryEn: "Swimming Public Pool",
        title: "Swimming Public Pool",
        titleEn: "Swimming Public Pool",
        locationEn: "Swimming Hall Shallow",
        dayOfWeek: "Mon",
        startTime: "16:00:00",
      } as unknown) as Partial<Workout>),
      createWorkout(({
        id: 2,
        category: "Schwimmen öff. Schwimmbetrieb",
        categoryEn: "Swimming Public Pool",
        title: "Swimming Public Pool",
        titleEn: "Swimming Public Pool",
        locationEn: "Swimming Hall Deep",
        dayOfWeek: "Tue",
        startTime: "18:00:00",
      } as unknown) as Partial<Workout>),
    ];

    const state = buildVisibleWorkoutCategoryState(items, [], "", "Swimming Public Pool");

    expect(state.categoryGroups.map((group) => group.category)).toEqual(["Swimming Public Pool"]);
    expect(state.selectedCategory).toBe("Swimming Public Pool");
    expect(state.items).toHaveLength(2);
    expect(state.items.map((item) => item.locationEn)).toEqual([
      "Swimming Hall Shallow",
      "Swimming Hall Deep",
    ]);
  });

  test("keeps categories visible when waitlist is the remaining option", () => {
    const items: Workout[] = [
      createWorkout({ id: 1, categoryEn: "Swimming", bookingStatus: "waitlist" }),
      createWorkout({ id: 2, category: "Yoga", categoryEn: "Yoga", bookingStatus: "available", title: "Yoga", titleEn: "Yoga" }),
    ];

    const state = buildVisibleWorkoutCategoryState(items, [], "", "Swimming");

    expect(state.categoryGroups.map((group) => group.category)).toEqual(["Swimming", "Yoga"]);
    expect(state.selectedCategory).toBe("Swimming");
    expect(state.items).toHaveLength(1);
    expect(state.items[0].bookingStatus).toBe("waitlist");
  });

  test("falls back to the first visible category when the requested one is hidden", () => {
    const items: Workout[] = [
      createWorkout({ id: 1, categoryEn: "Swimming", bookingStatus: "fully_booked" }),
      createWorkout({ id: 2, category: "Running", categoryEn: "Running", bookingStatus: "see_text", title: "Run", titleEn: "Run" }),
    ];

    const state = buildVisibleWorkoutCategoryState(items, [], "", "Swimming");

    expect(state.categoryGroups.map((group) => group.category)).toEqual(["Running"]);
    expect(state.selectedCategory).toBe("Running");
    expect(state.items).toHaveLength(1);
    expect(state.items[0].categoryEn).toBe("Running");
  });

  test("limits visible categories to the selected provider while keeping provider counts available", () => {
    const items: Workout[] = [
      createWorkout({
        id: 1,
        source: "CAU Kiel Sportzentrum",
        category: "Swimming",
        categoryEn: "Swimming",
        title: "Pool",
        titleEn: "Pool",
      }),
      createWorkout({
        id: 2,
        source: "Urban Apes",
        category: "Bouldering",
        categoryEn: "Bouldering",
        title: "urban apes Kiel",
        titleEn: "urban apes Kiel",
      }),
    ];

    const state = buildVisibleWorkoutCategoryState(items, [], "Urban Apes", "");

    expect(state.providerGroups).toEqual([
      { provider: "CAU Kiel Sportzentrum", count: 1 },
      { provider: "Urban Apes", count: 1 },
    ]);
    expect(state.categoryGroups.map((group) => group.category)).toEqual(["Bouldering"]);
    expect(state.selectedProvider).toBe("Urban Apes");
    expect(state.items).toHaveLength(1);
    expect(state.items[0].source).toBe("Urban Apes");
  });
});
