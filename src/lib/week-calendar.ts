export interface WeekCalendarScheduleRowLike {
  source_type: string | null;
  plan_id: number | null;
  schedule_id: number | null;
  assignment_id: number | null;
  workout_id: number | null;
  course_id?: number | null;
  event_date?: string | null;
  start_time?: string | null;
}

const COURSE_TINTS = [
  {
    border: "border-blue-500",
    bg: "bg-blue-500/20",
    hoverBg: "hover:bg-blue-500/30",
    solidBg: "bg-blue-500",
    text: "text-blue-950",
  },
  {
    border: "border-emerald-500",
    bg: "bg-emerald-500/20",
    hoverBg: "hover:bg-emerald-500/30",
    solidBg: "bg-emerald-500",
    text: "text-emerald-950",
  },
  {
    border: "border-amber-500",
    bg: "bg-amber-500/20",
    hoverBg: "hover:bg-amber-500/30",
    solidBg: "bg-amber-500",
    text: "text-amber-950",
  },
  {
    border: "border-violet-500",
    bg: "bg-violet-500/20",
    hoverBg: "hover:bg-violet-500/30",
    solidBg: "bg-violet-500",
    text: "text-violet-950",
  },
  {
    border: "border-rose-500",
    bg: "bg-rose-500/20",
    hoverBg: "hover:bg-rose-500/30",
    solidBg: "bg-rose-500",
    text: "text-rose-950",
  },
  {
    border: "border-cyan-500",
    bg: "bg-cyan-500/20",
    hoverBg: "hover:bg-cyan-500/30",
    solidBg: "bg-cyan-500",
    text: "text-cyan-950",
  },
  {
    border: "border-lime-500",
    bg: "bg-lime-500/20",
    hoverBg: "hover:bg-lime-500/30",
    solidBg: "bg-lime-500",
    text: "text-lime-950",
  },
  {
    border: "border-slate-500",
    bg: "bg-slate-500/20",
    hoverBg: "hover:bg-slate-500/30",
    solidBg: "bg-slate-500",
    text: "text-slate-950",
  },
] as const;

export function getWeekCalendarEventColor(courseCode: string | null | undefined) {
  const seed = (courseCode || "unknown").trim().toUpperCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return COURSE_TINTS[hash % COURSE_TINTS.length];
}

export function shouldIncludeWeekCalendarRow(row: WeekCalendarScheduleRowLike): boolean {
  if (row.source_type === "workout" && row.workout_id != null) return true;
  if (row.source_type !== "study_plan") return false;
  return row.plan_id != null && row.schedule_id == null && row.assignment_id == null;
}

export interface TodayRoutineEventLike {
  key: string;
  sourceType: "study_plan" | "workout" | "assignment";
  courseId: number | null;
  date: string;
  planId: number | null;
  scheduleId: number | null;
  assignmentId: number | null;
  workoutId: number | null;
  startTime: string;
}

export interface TodayRoutineGroup<T extends TodayRoutineEventLike> {
  parent: T;
  children: T[];
}

export function buildTodayRoutineGroups<T extends TodayRoutineEventLike>(events: T[]): TodayRoutineGroup<T>[] {
  const sorted = [...events].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.key.localeCompare(b.key));
  const parentByCourseDate = new Map<string, T>();

  for (const event of sorted) {
    if (event.sourceType === "study_plan" && event.planId && !event.scheduleId && !event.assignmentId) {
      parentByCourseDate.set(`${event.courseId ?? "none"}::${event.date}`, event);
    }
  }

  const groups: TodayRoutineGroup<T>[] = [];
  const groupByParentKey = new Map<string, TodayRoutineGroup<T>>();

  for (const event of sorted) {
    const isParentStudyPlan = event.sourceType === "study_plan" && event.planId && !event.scheduleId && !event.assignmentId;
    const isCourseScheduleChild = event.sourceType === "study_plan" && event.scheduleId != null;

    if (isParentStudyPlan || event.sourceType === "workout") {
      const group = { parent: event, children: [] };
      groups.push(group);
      groupByParentKey.set(event.key, group);
      continue;
    }

    if (isCourseScheduleChild) {
      const parent = parentByCourseDate.get(`${event.courseId ?? "none"}::${event.date}`);
      if (parent) {
        const group = groupByParentKey.get(parent.key);
        if (group) {
          group.children.push(event);
          continue;
        }
      }
    }

    groups.push({ parent: event, children: [] });
  }

  return groups;
}
