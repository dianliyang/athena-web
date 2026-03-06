import { Suspense } from "react";
import StudyCalendar from "@/components/home/StudyCalendar";
import Link from "next/link";
import { getUser, createClient, mapCourseFromRow } from "@/lib/supabase/server";
import { getLanguage } from "@/actions/language";
import { getDictionary, Dictionary } from "@/lib/dictionary";
import { Button } from "@/components/ui/button";

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
        <p className="text-gray-500 font-mono uppercase tracking-widest">{dict.dashboard.identity.user_not_found}</p>
        <Button variant="outline" asChild><Link href="/login">{dict.dashboard.login.title}</Link></Button>
      </div>
    );
  }

  return (
    <main className="flex h-full w-full flex-col px-4 pb-4">
      <Suspense fallback={null}>
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
  const supabase = await createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
  const endOfRange = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().slice(0, 10);

  // 1. Fetch Schedule via RPC
  const { data: scheduleRows } = await (supabase as any).rpc("get_user_schedule", { // eslint-disable-line @typescript-eslint/no-explicit-any
    p_user_id: userId,
    p_start_date: startOfMonth,
    p_end_date: endOfRange,
  });

  // 2. Fetch Enrolled Courses for Metadata
  const coursesRes = await supabase
      .from('courses')
      .select(`
        id, university, course_code, title, units, credit, url, details,
        user_courses!inner(status)
      `)
      .eq('user_courses.user_id', userId)
      .neq('user_courses.status', 'hidden');

  const enrolledCourses = (coursesRes.data || []).map(row => mapCourseFromRow(row));

  return (
    <div className="h-full min-h-0 flex flex-col">
      <StudyCalendar
        courses={enrolledCourses as unknown as Parameters<typeof StudyCalendar>[0]["courses"]}
        scheduleRows={scheduleRows || []}
        dict={dict.dashboard.roadmap}
      />
    </div>
  );
}
