import { Suspense } from "react";
import StudyCalendar from "@/components/home/StudyCalendar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getUser, createClient, mapCourseFromRow } from "@/lib/supabase/server";
import { getLanguage } from "@/actions/language";
import { getDictionary, Dictionary } from "@/lib/dictionary";

export const dynamic = "force-dynamic";

export default async function StudySchedulePage() {
  const [user, lang] = await Promise.all([
    getUser(),
    getLanguage(),
  ]);
  const dict = await getDictionary(lang);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-gray-500 font-mono uppercase tracking-widest">{dict.dashboard.profile.user_not_found}</p>
        <Button asChild className="mt-8"><Link href="/login">{dict.dashboard.login.title}</Link></Button>
      </div>
    );
  }

  return (
    <main className="w-full flex flex-col gap-5">
      <Suspense fallback={<div className="animate-pulse h-96 bg-gray-100 rounded-lg" />}>
        <StudyScheduleContent userId={user.id} dict={dict} />
      </Suspense>
    </main>
  );
}

async function StudyScheduleContent({
  userId, dict
}: {
  userId: string;
  dict: Dictionary;
}) {
  type PlanCourse = {
    id: number;
    title: string;
    course_code: string;
    university: string;
  };

  type NormalizedPlan = {
    id: number;
    course_id: number;
    start_date: string;
    end_date: string;
    days_of_week: number[];
    start_time: string;
    end_time: string;
    location: string | null;
    kind: string;
    courses: PlanCourse | null;
  };

  const supabase = await createClient();

  const [coursesRes, plansRes, logsRes] = await Promise.all([
    supabase
      .from('courses')
      .select(`
        id, university, course_code, title, units, credit, url, details,
        user_courses!inner(status)
      `)
      .eq('user_courses.user_id', userId)
      .neq('user_courses.status', 'hidden'),
    
    supabase
      .from('study_plans')
      .select(`
        id,
        course_id,
        start_date,
        end_date,
        days_of_week,
        start_time,
        end_time,
        location,
        kind,
        courses(id, title, course_code, university)
      `)
      .eq('user_id', userId),

    supabase
      .from('study_logs')
      .select('*')
      .eq('user_id', userId),
  ]);

  const enrolledCourses = (coursesRes.data || []).map(row => mapCourseFromRow(row));
  const rawPlans = plansRes.data || [];
  const logs = logsRes.data || [];

  const toDateOnly = (value: unknown) => {
    if (typeof value !== "string") return "";
    return value.includes("T") ? value.split("T")[0] : value;
  };

  const normalizeDays = (value: unknown): number[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((d) => (typeof d === "number" ? d : Number(d)))
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  };

  const normalizeCourse = (value: unknown): PlanCourse | null => {
    const row = Array.isArray(value) ? value[0] : value;
    if (!row || typeof row !== "object") return null;
    const obj = row as Record<string, unknown>;
    const id = Number(obj.id);
    if (!Number.isFinite(id)) return null;
    return {
      id,
      title: String(obj.title || ""),
      course_code: String(obj.course_code || ""),
      university: String(obj.university || ""),
    };
  };

  const allPlans: NormalizedPlan[] = rawPlans.map((plan: Record<string, unknown>) => ({
    ...plan,
    id: Number(plan.id),
    course_id: Number(plan.course_id),
    start_time: String(plan.start_time || ""),
    end_time: String(plan.end_time || ""),
    location: plan.location == null ? null : String(plan.location),
    kind: String(plan.kind || ""),
    courses: normalizeCourse(plan.courses),
    start_date: toDateOnly(plan.start_date),
    end_date: toDateOnly(plan.end_date),
    days_of_week: normalizeDays(plan.days_of_week),
  })) as NormalizedPlan[];

  const enrolledCourseIds = new Set(enrolledCourses.map((course) => course.id));
  const plans = allPlans.filter((plan) => enrolledCourseIds.has(plan.course_id));
  const validPlanIds = new Set(plans.map((plan) => plan.id));
  const filteredLogs = (logs || []).filter((log: { plan_id: number }) => validPlanIds.has(log.plan_id));

  const courseIdsWithPlans = new Set(plans.map((p) => p.course_id));
  const coursesWithoutPlans = enrolledCourses
    .filter(c =>
      c.university === 'CAU Kiel' &&
      !courseIdsWithPlans.has(c.id) &&
      c.details?.schedule &&
      typeof c.details.schedule === 'object' &&
      Object.keys(c.details.schedule as Record<string, unknown>).length > 0
    )
    .map(c => ({ id: c.id, courseCode: c.courseCode, title: c.title }));

  return (
    <div className="flex flex-col gap-4">
      <section className="sticky top-[-12px] z-20 -mx-3 sm:-mx-4 px-3 sm:px-4 pb-4 bg-[#fcfcfc] border-b border-[#e5e5e5]">
        <div className="rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-3 sm:p-4">
          <h3 className="text-lg font-bold text-[#1f1f1f]">{dict.dashboard.roadmap.calendar_title}</h3>
          <p className="text-xs text-[#7a7a7a] mt-0.5">Manage your academic schedule and track session attendance.</p>
        </div>
      </section>

      <div className="mt-2">
        <StudyCalendar
          courses={enrolledCourses as unknown as Parameters<typeof StudyCalendar>[0]["courses"]}
          plans={plans}
          logs={filteredLogs}
          dict={dict.dashboard.roadmap}
          coursesWithoutPlans={coursesWithoutPlans}
        />
      </div>
    </div>
  );
}
