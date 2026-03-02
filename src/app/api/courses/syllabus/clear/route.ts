import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, getUser } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export const runtime = "nodejs";

type SyllabusRow = Record<string, unknown>;

function normalizeForCompare(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function cleanScheduleRows(rows: SyllabusRow[]) {
  return rows
    .map<SyllabusRow>((entry) => {
      const title = typeof entry.title === "string" ? entry.title.trim() : "";
      const topics = Array.isArray(entry.topics)
        ? entry.topics.filter((topic): topic is string => typeof topic === "string" && topic.trim().length > 0).map((topic) => topic.trim())
        : [];
      const cleanedTopics = title
        ? topics.filter((topic) => normalizeForCompare(topic) !== normalizeForCompare(title))
        : topics;

      return {
        ...entry,
        topics: cleanedTopics,
      };
    })
    .filter((entry) => {
      const date = typeof entry.date === "string" ? entry.date.trim() : "";
      const dateEnd = typeof entry.date_end === "string" ? entry.date_end.trim() : "";
      if (!date && !dateEnd) return false;

      const title = typeof entry.title === "string" ? entry.title.trim() : "";
      const topics = Array.isArray(entry.topics)
        ? entry.topics.filter((topic): topic is string => typeof topic === "string" && topic.trim().length > 0).map((topic) => topic.trim())
        : [];
      const description = typeof entry.description === "string" ? entry.description.trim() : "";
      const instructor = typeof entry.instructor === "string" ? entry.instructor.trim() : "";
      const materialsCount =
        (Array.isArray(entry.slides) ? entry.slides.length : 0) +
        (Array.isArray(entry.videos) ? entry.videos.length : 0) +
        (Array.isArray(entry.readings) ? entry.readings.length : 0) +
        (Array.isArray(entry.modules) ? entry.modules.length : 0);
      const tasksCount =
        (Array.isArray(entry.assignments) ? entry.assignments.length : 0) +
        (Array.isArray(entry.labs) ? entry.labs.length : 0) +
        (Array.isArray(entry.exams) ? entry.exams.length : 0) +
        (Array.isArray(entry.projects) ? entry.projects.length : 0);

      return Boolean(instructor) || Boolean(title) || topics.length > 0 || Boolean(description) || materialsCount > 0 || tasksCount > 0;
    });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId } = await request.json();
  const numericCourseId = Number(courseId || 0);
  if (!numericCourseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: enrollment } = await supabase
    .from("user_courses")
    .select("course_id")
    .eq("user_id", user.id)
    .eq("course_id", numericCourseId)
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: syllabus, error: syllabusError } = await supabase
    .from("course_syllabi")
    .select("id, schedule")
    .eq("course_id", numericCourseId)
    .maybeSingle();
  if (syllabusError) return NextResponse.json({ error: syllabusError.message }, { status: 500 });
  if (!syllabus) return NextResponse.json({ error: "Syllabus not found" }, { status: 404 });

  const currentSchedule = Array.isArray(syllabus.schedule) ? (syllabus.schedule as SyllabusRow[]) : [];
  const cleanedSchedule = cleanScheduleRows(currentSchedule);

  const { error: updateError } = await supabase
    .from("course_syllabi")
    .update({
      schedule: cleanedSchedule as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", syllabus.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    schedule: cleanedSchedule,
    removedRows: Math.max(0, currentSchedule.length - cleanedSchedule.length),
  });
}
