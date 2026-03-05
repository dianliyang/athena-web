export interface CourseDetailCalendarAssignment {
  id: number;
  kind: string;
  label: string;
  due_on: string | null;
  url: string | null;
  description: string | null;
}

export interface CourseDetailCalendarScheduleItem {
  date: string;
  title: string | null;
  kind: string | null;
  focus: string | null;
  durationMinutes: number | null;
}

export interface CourseDetailCalendarStudyPlan {
  id?: number;
  startDate: string;
  endDate: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  location: string;
  kind: string;
}

export interface CourseDetailCalendarEvent {
  label: string;
  meta: string;
  kind: string;
}

export interface CourseDetailCalendarResult {
  range: null | { startIso: string; endIso: string };
  months: Array<{
    key: string;
    label: string;
    cells: Array<{
      dateIso: string;
      day: number;
      inMonth: boolean;
      inRange: boolean;
    }>;
  }>;
  eventsByDate: Map<string, CourseDetailCalendarEvent[]>;
}

function parseIsoDate(value: string): Date | null {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoDateUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysUtc(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function buildCourseDetailCalendar({
  courseTitle,
  assignments,
  scheduleItems,
  studyPlans,
}: {
  courseTitle: string;
  assignments: CourseDetailCalendarAssignment[];
  scheduleItems: CourseDetailCalendarScheduleItem[];
  studyPlans: CourseDetailCalendarStudyPlan[];
}): CourseDetailCalendarResult {
  const scheduleRows = scheduleItems
    .map((item) => {
      const parsedDate = parseIsoDate(item.date);
      if (!parsedDate) return null;
      const dateIso = toIsoDateUtc(parsedDate);
      const label = String(item.title || item.focus || item.kind || "Scheduled Task").trim();
      const duration =
        typeof item.durationMinutes === "number" && Number.isFinite(item.durationMinutes)
          ? `${Math.max(1, Math.round(item.durationMinutes))}m`
          : "";
      const kind = String(item.kind || "task").trim().toLowerCase();
      const meta = [kind, duration].filter(Boolean).join(" · ") || "Scheduled";
      return { dateIso, label, meta, kind };
    })
    .filter((row): row is { dateIso: string; label: string; meta: string; kind: string } => row !== null);

  const planRows = studyPlans.flatMap((plan) => {
    const startDate = parseIsoDate(plan.startDate);
    const endDate = parseIsoDate(plan.endDate);
    if (!startDate || !endDate) return [];

    const normalizedDays = (plan.daysOfWeek || [])
      .map((day) => (typeof day === "number" ? day : Number(day)))
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
    if (normalizedDays.length === 0) return [];

    const kind = String(plan.kind || "study-plan").trim().toLowerCase() || "study-plan";
    const timeRange = [plan.startTime, plan.endTime].filter(Boolean).join("-");
    const metaParts = [plan.kind || "Study Plan", timeRange, plan.location].filter(Boolean);
    const rows: Array<{ dateIso: string; label: string; meta: string; kind: string }> = [];

    for (let cursor = new Date(startDate.getTime()); cursor <= endDate; cursor = addDaysUtc(cursor, 1)) {
      if (!normalizedDays.includes(cursor.getUTCDay())) continue;
      rows.push({
        dateIso: toIsoDateUtc(cursor),
        label: courseTitle,
        meta: metaParts.join(" · "),
        kind,
      });
    }

    return rows;
  });

  const datedRows = [...scheduleRows, ...planRows];

  if (datedRows.length === 0) {
    return {
      range: null,
      months: [],
      eventsByDate: new Map<string, CourseDetailCalendarEvent[]>(),
    };
  }

  const datedSorted = datedRows.map((row) => row.dateIso).sort();
  const rangeStart = parseIsoDate(datedSorted[0])!;
  const rangeEnd = parseIsoDate(datedSorted[datedSorted.length - 1])!;
  const rangeStartIso = toIsoDateUtc(rangeStart);
  const rangeEndIso = toIsoDateUtc(rangeEnd);

  const deadlineRows = assignments
    .map((item) => {
      if (!item.due_on) return null;
      const parsedDate = parseIsoDate(item.due_on);
      if (!parsedDate) return null;
      const dateIso = toIsoDateUtc(parsedDate);
      if (dateIso < rangeStartIso || dateIso > rangeEndIso) return null;
      const label = String(item.label || "Deadline").trim() || "Deadline";
      const kind = String(item.kind || "deadline").trim().toLowerCase();
      return {
        dateIso,
        label,
        meta: `Deadline${kind ? ` · ${kind}` : ""}`,
        kind,
      };
    })
    .filter((row): row is { dateIso: string; label: string; meta: string; kind: string } => row !== null);

  const rows = [...datedRows, ...deadlineRows];
  const eventsByDate = new Map<string, CourseDetailCalendarEvent[]>();
  for (const row of rows) {
    const list = eventsByDate.get(row.dateIso) || [];
    list.push({ label: row.label, meta: row.meta, kind: row.kind });
    eventsByDate.set(row.dateIso, list);
  }

  const months: CourseDetailCalendarResult["months"] = [];
  for (
    let cursor = new Date(Date.UTC(rangeStart.getUTCFullYear(), rangeStart.getUTCMonth(), 1));
    cursor <= new Date(Date.UTC(rangeEnd.getUTCFullYear(), rangeEnd.getUTCMonth(), 1));
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
  ) {
    const monthStart = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0));
    const gridStart = addDaysUtc(monthStart, -monthStart.getUTCDay());
    const gridEnd = addDaysUtc(monthEnd, 6 - monthEnd.getUTCDay());
    const cells: CourseDetailCalendarResult["months"][number]["cells"] = [];

    for (let d = new Date(gridStart.getTime()); d <= gridEnd; d = addDaysUtc(d, 1)) {
      const dateIso = toIsoDateUtc(d);
      cells.push({
        dateIso,
        day: d.getUTCDate(),
        inMonth: d.getUTCMonth() === monthStart.getUTCMonth(),
        inRange: dateIso >= rangeStartIso && dateIso <= rangeEndIso,
      });
    }

    months.push({
      key: `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, "0")}`,
      label: monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      cells,
    });
  }

  return {
    range: { startIso: rangeStartIso, endIso: rangeEndIso },
    months,
    eventsByDate,
  };
}
