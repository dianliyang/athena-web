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

export interface WeekCalendarEventColor {
  borderColor: string;
  backgroundColor: string;
  textColor: string;
}

function deriveCourseHue(courseCode: string) {
  const normalized = courseCode.trim().toUpperCase();
  const letters = normalized.replace(/[^A-Z]/g, "");
  const digits = normalized.replace(/\D/g, "");
  const symbols = normalized.replace(/[A-Z0-9]/g, "");

  const letterValue = [...letters].reduce(
    (sum, letter, index) => sum + (letter.charCodeAt(0) - 64) * (index + 1),
    0,
  );
  const digitValue = [...digits].reduce(
    (sum, digit, index) => sum + Number(digit) * (index + 3),
    0,
  );
  const symbolValue = [...symbols].reduce(
    (sum, symbol, index) => sum + symbol.charCodeAt(0) * (index + 5),
    0,
  );

  return (letterValue * 11 + digitValue * 17 + symbolValue * 23 + normalized.length * 29) % 360;
}

export function getWeekCalendarEventColor(courseCode: string | null | undefined) {
  const hue = deriveCourseHue(courseCode || "unknown");
  return {
    borderColor: `hsl(${hue} 70% 45%)`,
    backgroundColor: `hsl(${hue} 85% 92%)`,
    textColor: `hsl(${hue} 55% 20%)`,
  };
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
  groupKey?: string | null;
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

function isExplicitRoutineParent<T extends TodayRoutineEventLike>(event: T) {
  return event.sourceType === "study_plan" && event.planId != null && event.scheduleId == null && event.assignmentId == null;
}

function isRoutineChildEvent<T extends TodayRoutineEventLike>(event: T) {
  return (
    (event.sourceType === "study_plan" && event.scheduleId != null) ||
    (event.sourceType === "assignment" && event.assignmentId != null)
  );
}

function getRoutineParentKey<T extends TodayRoutineEventLike>(event: T) {
  return `${event.courseId ?? "none"}::${event.groupKey ?? "none"}::${event.date}`;
}

export function buildTodayRoutineGroups<T extends TodayRoutineEventLike>(events: T[]): TodayRoutineGroup<T>[] {
  const getRoutineSortTime = (event: T) =>
    event.sourceType === "assignment" ? "98:00:00" : event.startTime;

  const sorted = [...events].sort((a, b) => getRoutineSortTime(a).localeCompare(getRoutineSortTime(b)) || a.key.localeCompare(b.key));
  
  const explicitParentsByParentKey = new Map<string, T>();
  const eventsByParentKey = new Map<string, T[]>();

  for (const event of sorted) {
    const parentKey = getRoutineParentKey(event);
    const list = eventsByParentKey.get(parentKey) || [];
    list.push(event);
    eventsByParentKey.set(parentKey, list);

    if (isExplicitRoutineParent(event)) {
      explicitParentsByParentKey.set(parentKey, event);
    }
  }

  const groups: TodayRoutineGroup<T>[] = [];
  const groupMapByParentKey = new Map<string, TodayRoutineGroup<T>>();
  const consumedKeys = new Set<string>();

  for (const event of sorted) {
    if (consumedKeys.has(event.key)) continue;

    const parentKey = getRoutineParentKey(event);
    const explicitParent = explicitParentsByParentKey.get(parentKey);

    if (explicitParent) {
      let group = groupMapByParentKey.get(parentKey);
      if (!group) {
        group = { parent: explicitParent, children: [] };
        groupMapByParentKey.set(parentKey, group);
        groups.push(group);
      }

      if (event.key !== explicitParent.key) {
        group.children.push(event);
      }
      consumedKeys.add(event.key);
      consumedKeys.add(explicitParent.key); // Ensure parent itself is consumed
      continue;
    }

    if (event.sourceType === "workout") {
      groups.push({ parent: event, children: [] });
      consumedKeys.add(event.key);
      continue;
    }

    if (isRoutineChildEvent(event)) {
      const siblings = eventsByParentKey.get(parentKey) || [];
      const syntheticChildren = siblings.filter((candidate) => isRoutineChildEvent(candidate));
      
      const shouldSynthesizeParent =
        syntheticChildren.length > 1 &&
        siblings.every((candidate) => candidate.sourceType !== "workout") &&
        !siblings.some((candidate) => isExplicitRoutineParent(candidate));

      if (shouldSynthesizeParent) {
        const base = syntheticChildren[0];
        const syntheticParent = {
          ...base,
          key: `synthetic-parent:${parentKey}`,
          planId: null,
          scheduleId: null,
          assignmentId: null,
          workoutId: null,
          sourceType: "study_plan" as T["sourceType"],
          startTime: syntheticChildren[0]?.startTime || base.startTime,
        } as T;
        groups.push({ parent: syntheticParent, children: syntheticChildren });
        syntheticChildren.forEach((child) => consumedKeys.add(child.key));
        continue;
      }
    }

    groups.push({ parent: event, children: [] });
    consumedKeys.add(event.key);
  }

  return groups;
}
