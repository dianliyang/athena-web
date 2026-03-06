import { Suspense } from "react";
import Link from "next/link";
import { getLanguage } from "@/actions/language";
import { getDictionary } from "@/lib/dictionary";
import { createClient, getUser, mapCourseFromRow } from "@/lib/supabase/server";
import LearningProfileChart from "@/components/identity/LearningProfileChart";
import CourseStatusChart from "@/components/identity/CourseStatusChart";
import AttendanceLearningChart from "@/components/dashboard/AttendanceLearningChart";
import OverviewRoutineList from "@/components/dashboard/OverviewRoutineList";
import CourseMomentumCard from "@/components/dashboard/CourseMomentumCard";
import { Button } from "@/components/ui/button";
import { buildOverviewRoutineItems, buildWeeklyActivity } from "@/lib/overview-routine";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [user, lang] = await Promise.all([getUser(), getLanguage()]);
  const dict = await getDictionary(lang);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-gray-500 font-mono uppercase tracking-widest">{dict.dashboard.identity.user_not_found}</p>
        <Button variant="outline" asChild>
          <Link href="/login">{dict.dashboard.login.title}</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="h-full w-full px-4 py-4">
      <div className="sticky top-0 z-20 -mx-4 -mt-4 bg-background/95 px-4 pb-5 pt-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Course momentum, today&apos;s routine, and learning identity.
          </p>
        </div>
      </div>
      <Suspense fallback={null}>
        <OverviewContent userId={user.id} />
      </Suspense>
    </main>
  );
}

async function OverviewContent({ userId }: { userId: string }) {
  const supabase = await createClient();
  const todayIso = new Date().toISOString().slice(0, 10);
  const referenceNowMs = new Date(`${todayIso}T23:59:59.999Z`).getTime();

  // 1. Fetch Today's Schedule via RPC (Deduplicated & Expanded)
  const { data: scheduleRows } = await (supabase as any).rpc("get_user_schedule", { // eslint-disable-line @typescript-eslint/no-explicit-any
    p_user_id: userId,
    p_start_date: todayIso,
    p_end_date: todayIso,
  });

  // 2. Fetch other metrics
  const [coursesRes, logsRes, workoutLogsRes] = await Promise.all([
    supabase
      .from("courses")
      .select(`
        id, university, course_code, title, units, credit, url, details,
        user_courses!inner(status, progress, updated_at)
      `)
      .eq("user_courses.user_id", userId)
      .neq("user_courses.status", "hidden"),
    supabase
      .from("study_logs")
      .select("plan_id, log_date, is_completed, course_schedule_id, course_assignment_id")
      .eq("user_id", userId),
    supabase
      .from("user_workout_logs")
      .select("workout_id, log_date, is_attended")
      .eq("user_id", userId),
  ]);

  const enrolledCourses = (coursesRes.data || []).map((row) => mapCourseFromRow(row));
  const userCourseRows = (coursesRes.data || []).map((row: Record<string, unknown>) => {
    const userCourse = Array.isArray(row.user_courses) ? row.user_courses[0] : row.user_courses;
    return {
      status: typeof userCourse?.status === "string" ? userCourse.status : "pending",
      progress: Number(userCourse?.progress || 0),
      updated_at: typeof userCourse?.updated_at === "string" ? userCourse.updated_at : null,
    };
  });
  const enrolledCourseIds = enrolledCourses.map((course) => course.id);

  const [fieldsRes] =
    enrolledCourseIds.length > 0
      ? await Promise.all([
          supabase.from("course_fields").select("fields(name)").in("course_id", enrolledCourseIds),
        ])
      : [
          { data: [], error: null },
        ];

  const statusCounts: Record<string, number> = {};
  for (const row of userCourseRows) {
    statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
  }

  const fieldCounts: Record<string, number> = {};
  ((fieldsRes.data || []) as Array<{ fields: { name: string } | null }>).forEach((row) => {
    if (row.fields?.name) {
      fieldCounts[row.fields.name] = (fieldCounts[row.fields.name] || 0) + 1;
    }
  });
  const fieldStats = Object.entries(fieldCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const recentUpdates30 = userCourseRows.filter((row) => {
    if (!row.updated_at) return false;
    const ts = new Date(row.updated_at).getTime();
    const diffDays = (referenceNowMs - ts) / (24 * 60 * 60 * 1000);
    return Number.isFinite(ts) && diffDays <= 30;
  }).length;
  const inProgressRows = userCourseRows.filter((row) => row.status === "in_progress");
  const stalledCount = inProgressRows.filter((row) => {
    if (!row.updated_at) return true;
    const ts = new Date(row.updated_at).getTime();
    const diffDays = (referenceNowMs - ts) / (24 * 60 * 60 * 1000);
    return !Number.isFinite(ts) || diffDays > 14;
  }).length;
  const avgProgress =
    inProgressRows.length > 0
      ? Math.round(inProgressRows.reduce((sum, row) => sum + row.progress, 0) / inProgressRows.length)
      : 0;

  const routineItems = buildOverviewRoutineItems(scheduleRows || []);

  const inProgressCount = statusCounts.in_progress || 0;
  const attendedToday = routineItems.filter((item) => item.sourceType === "workout" && item.isDone).length;

  return (
    <div className="min-h-full space-y-6 pb-4">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-2xl border border-border bg-background flex flex-col h-full">
          <div className="border-b border-border px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">Today&apos;s Routine</h2>
                <p className="text-sm text-muted-foreground">
                  Specific tasks and routine items, ordered by time.
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Primary focus</p>
                <p className="mt-1 text-sm font-bold text-foreground truncate max-w-[280px]">
                  {fieldStats[0]?.name || "Undeclared"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4 p-5 overflow-auto">
            <OverviewRoutineList initialItems={routineItems} />
          </div>
        </section>
        
        <aside className="h-full">
          <CourseMomentumCard 
            routineItems={routineItems} 
            inProgressCount={inProgressCount} 
            attendedToday={attendedToday} 
          />
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-border bg-background relative">
          <div className="border-b border-border px-6 py-5">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">Course momentum</h2>
            <p className="text-sm text-muted-foreground">
              Status mix, update cadence, and current progress.
            </p>
          </div>
          <div className="p-4">
            <CourseStatusChart
              data={Object.entries(statusCounts)}
              emptyText="No course status data yet"
              recentUpdates30={recentUpdates30}
              inProgressCount={inProgressCount}
              stalledCount={stalledCount}
              avgProgress={avgProgress}
              weeklyActivity={buildWeeklyActivity(userCourseRows.map((row) => row.updated_at))}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background relative">
          <div className="border-b border-border px-6 py-5">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">Execution metrics</h2>
            <p className="text-sm text-muted-foreground">
              Attendance and study consistency over last 7 days.
            </p>
          </div>
          <div className="p-4">
            <AttendanceLearningChart
              studyLogs={(logsRes.data || []).map(l => ({ log_date: String(l.log_date), is_completed: Boolean(l.is_completed) }))}
              workoutLogs={(workoutLogsRes.data || []).map(l => ({ log_date: String(l.log_date), is_attended: Boolean(l.is_attended) }))}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background relative">
          <div className="border-b border-border px-6 py-5">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">Learning identity</h2>
            <p className="text-sm text-muted-foreground">
              Field distribution across your current learning graph.
            </p>
          </div>
          <div className="p-4">
            <LearningProfileChart
              data={fieldStats}
              unitLabel="units"
              emptyText="No learning units yet"
            />
          </div>
        </section>
      </section>
    </div>
  );
}
