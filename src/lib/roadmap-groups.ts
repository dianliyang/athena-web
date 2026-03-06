type RoadmapPlanLike = {
  course_id: number;
  start_date: string;
  start_time: string;
};

type RoadmapCourseLike = {
  id: number;
  title: string;
};

type GroupedRoadmapCourse<TCourse, TPlan> = {
  course: TCourse;
  plan: TPlan | null;
};

function comparePlans(
  left?: { start_date: string; start_time: string } | null,
  right?: { start_date: string; start_time: string } | null,
) {
  const leftDate = left?.start_date || "9999-12-31";
  const rightDate = right?.start_date || "9999-12-31";
  if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);

  const leftTime = left?.start_time || "99:99:99";
  const rightTime = right?.start_time || "99:99:99";
  if (leftTime !== rightTime) return leftTime.localeCompare(rightTime);

  return 0;
}

export function groupRoadmapCoursesByPlan<
  TCourse extends RoadmapCourseLike,
  TPlan extends RoadmapPlanLike,
>(
  courses: TCourse[],
  plans: TPlan[],
  todayIso: string,
): {
  active: Array<GroupedRoadmapCourse<TCourse, TPlan>>;
  planning: Array<GroupedRoadmapCourse<TCourse, TPlan>>;
} {
  const getPrimaryPlan = (courseId: number) =>
    plans
      .filter((plan) => plan.course_id === courseId)
      .sort((a, b) => comparePlans(a, b))[0] || null;

  const grouped = courses.map((course) => ({
    course,
    plan: getPrimaryPlan(course.id),
  }));

  const sortGrouped = (
    left: GroupedRoadmapCourse<TCourse, TPlan>,
    right: GroupedRoadmapCourse<TCourse, TPlan>,
  ) => {
    const planOrder = comparePlans(left.plan, right.plan);
    if (planOrder !== 0) return planOrder;
    return left.course.title.localeCompare(right.course.title);
  };

  return {
    active: grouped
      .filter(({ plan }) => Boolean(plan?.start_date) && plan!.start_date <= todayIso)
      .sort(sortGrouped),
    planning: grouped
      .filter(({ plan }) => !plan?.start_date || plan.start_date > todayIso)
      .sort(sortGrouped),
  };
}
