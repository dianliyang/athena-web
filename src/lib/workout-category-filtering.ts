import type { Workout } from "@/types";

interface WorkoutCategoryGroup {
  category: string;
  count: number;
  minStudentPrice: number | null;
  maxStudentPrice: number | null;
}

interface WorkoutProviderGroup {
  provider: string;
  count: number;
}

interface WorkoutStatusGroup {
  status: string;
  count: number;
}

interface WorkoutCategoryState {
  providerGroups: WorkoutProviderGroup[];
  categoryGroups: WorkoutCategoryGroup[];
  statusGroups: WorkoutStatusGroup[];
  allItems: Workout[];
  items: Workout[];
  selectedProvider: string;
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

function providerKey(workout: Workout) {
  return (workout.source || "Other").trim() || "Other";
}

function isVisibleWorkout(workout: Workout) {
  return !HIDDEN_CATEGORY_STATUSES.has(String(workout.bookingStatus || ""));
}

export function buildVisibleWorkoutCategoryState(
  workouts: Workout[],
  categoryFilters: string[],
  selectedProvider: string,
  selectedCategory: string,
): WorkoutCategoryState {
  const normalizedCategoryFilters = new Set(
    categoryFilters.map((value) => normalizeCategory(value)).filter(Boolean),
  );
  const normalizedSelectedProvider = selectedProvider.trim();

  const providerCounts = new Map<string, number>();
  const statusCounts = new Map<string, number>();
  const groupedVisible = new Map<string, Workout[]>();

  for (const workout of workouts) {
    if (!isVisibleWorkout(workout)) continue;

    const provider = providerKey(workout);
    providerCounts.set(provider, (providerCounts.get(provider) || 0) + 1);

    const bookingStatus = String(workout.bookingStatus || "").trim();
    if (bookingStatus) {
      statusCounts.set(bookingStatus, (statusCounts.get(bookingStatus) || 0) + 1);
    }

    if (normalizedSelectedProvider && provider !== normalizedSelectedProvider) continue;

    const category = categoryKey(workout);
    if (normalizedCategoryFilters.size > 0 && !normalizedCategoryFilters.has(category)) continue;

    const items = groupedVisible.get(category);
    if (items) items.push(workout);
    else groupedVisible.set(category, [workout]);
  }

  const providerGroups = Array.from(providerCounts.entries())
    .map(([provider, count]) => ({ provider, count }))
    .sort((a, b) => a.provider.localeCompare(b.provider));

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

  const allItems = Array.from(groupedVisible.values()).flat();

  const statusGroups = Array.from(statusCounts.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));

  const normalizedSelectedCategory = normalizeCategory(selectedCategory);
  const activeCategory = normalizedSelectedCategory && groupedVisible.has(normalizedSelectedCategory)
    ? normalizedSelectedCategory
    : categoryGroups[0]?.category || "";

  return {
    providerGroups,
    categoryGroups,
    statusGroups,
    allItems,
    items: groupedVisible.get(activeCategory) || [],
    selectedProvider: normalizedSelectedProvider,
    selectedCategory: activeCategory,
  };
}
