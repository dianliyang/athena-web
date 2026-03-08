import type { Workout } from "@/types";

interface WorkoutCategoryGroup {
  category: string;
  count: number;
  minStudentPrice: number | null;
  maxStudentPrice: number | null;
}

interface WorkoutCategoryState {
  categoryGroups: WorkoutCategoryGroup[];
  items: Workout[];
  selectedCategory: string;
}

const HIDDEN_CATEGORY_STATUSES = new Set(["fully_booked", "expired"]);

function normalizeCategory(value: string) {
  const trimmed = (value || "").trim();
  if (
    trimmed.toLowerCase().includes("semester fee") ||
    trimmed.toLowerCase().includes("semestergebühr")
  ) {
    return "Semester Fee";
  }
  return trimmed;
}

function categoryKey(workout: Workout) {
  return normalizeCategory((workout.categoryEn || workout.category || "Other").trim());
}

function isVisibleWorkout(workout: Workout) {
  return !HIDDEN_CATEGORY_STATUSES.has(String(workout.bookingStatus || ""));
}

export function buildVisibleWorkoutCategoryState(
  workouts: Workout[],
  categoryFilters: string[],
  selectedCategory: string,
): WorkoutCategoryState {
  const normalizedCategoryFilters = new Set(
    categoryFilters.map((value) => normalizeCategory(value)).filter(Boolean),
  );

  const visibleItemsRaw = workouts.filter(isVisibleWorkout);
  const visibleItems =
    normalizedCategoryFilters.size > 0
      ? visibleItemsRaw.filter((workout) => normalizedCategoryFilters.has(categoryKey(workout)))
      : visibleItemsRaw;

  const groupedVisible = new Map<string, Workout[]>();
  visibleItems.forEach((workout) => {
    const key = categoryKey(workout);
    const arr = groupedVisible.get(key) || [];
    arr.push(workout);
    groupedVisible.set(key, arr);
  });

  const categoryGroups = Array.from(groupedVisible.entries())
    .map(([category, items]) => {
      const prices = items
        .map((item) => item.priceStudent)
        .filter((value): value is number => typeof value === "number");
      return {
        category,
        count: items.length,
        minStudentPrice: prices.length ? Math.min(...prices) : null,
        maxStudentPrice: prices.length ? Math.max(...prices) : null,
      };
    })
    .sort((a, b) => {
      const isASemesterFee = a.category.toLowerCase().includes("semester fee") || a.category.toLowerCase().includes("semestergebühr");
      const isBSemesterFee = b.category.toLowerCase().includes("semester fee") || b.category.toLowerCase().includes("semestergebühr");
      if (isASemesterFee && !isBSemesterFee) return -1;
      if (!isASemesterFee && isBSemesterFee) return 1;
      return a.category.localeCompare(b.category);
    });

  const normalizedSelectedCategory = normalizeCategory(selectedCategory);
  const activeCategory = normalizedSelectedCategory && groupedVisible.has(normalizedSelectedCategory)
    ? normalizedSelectedCategory
    : categoryGroups[0]?.category || "";

  return {
    categoryGroups,
    items: groupedVisible.get(activeCategory) || [],
    selectedCategory: activeCategory,
  };
}
