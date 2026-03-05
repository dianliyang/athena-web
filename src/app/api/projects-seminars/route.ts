import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";
import { ProjectSeminarTableRow } from "@/components/projects-seminars/table/columns";

export async function GET(request: Request) {
  const user = await getUser();
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
  const size = Math.max(1, Number.parseInt(searchParams.get("size") || "20", 10));
  const offset = (page - 1) * size;
  const query = searchParams.get("q") || "";
  const categoriesFilter = (searchParams.get("category") || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const semestersFilter = (searchParams.get("semester") || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const sort = searchParams.get("sort") || "title";

  let dataQuery = supabase
    .from("projects_seminars")
    .select(
      "id, title, course_code, category, credit, url, latest_semester, university, details",
      { count: "exact" },
    );

  if (query) {
    dataQuery = dataQuery.textSearch("search_vector", query, { type: "websearch" });
  }
  if (categoriesFilter.length > 0) {
    dataQuery = dataQuery.in("category", categoriesFilter);
  }
  if (semestersFilter.length > 0) {
    const clauses = semestersFilter
      .map((value) => {
        const [term, yearRaw] = value.split(" ");
        const year = Number(yearRaw);
        if (!term || !Number.isFinite(year)) return null;
        return `and(latest_semester->>term.eq.${term},latest_semester->>year.eq.${year})`;
      })
      .filter((value): value is string => Boolean(value));

    if (clauses.length > 0) {
      dataQuery = dataQuery.or(clauses.join(","));
    }
  }

  if (sort === "newest") dataQuery = dataQuery.order("updated_at", { ascending: false });
  else if (sort === "credit") dataQuery = dataQuery.order("credit", { ascending: false, nullsFirst: false });
  else if (sort === "category") dataQuery = dataQuery.order("category", { ascending: true });
  else dataQuery = dataQuery.order("title", { ascending: true });

  const { data: items, count, error } = await dataQuery.range(offset, offset + size - 1);

  if (error) {
    console.error("[projects-seminars api] fetch error", error);
    return NextResponse.json({ error: "Failed to fetch seminars" }, { status: 500 });
  }

  const itemIds = (items || []).map((item) => item.id);
  const enrollmentMap = new Map<number, string>();
  const departmentMap = new Map<number, string>();

  if (user && itemIds.length > 0) {
    const { data: enrollmentRows } = await supabase
      .from("user_projects_seminars")
      .select("project_seminar_id, status")
      .eq("user_id", user.id)
      .in("project_seminar_id", itemIds);

    (enrollmentRows || []).forEach((row) => {
      enrollmentMap.set(row.project_seminar_id, row.status || "in_progress");
    });
  }

  if (itemIds.length > 0) {
    const { data: departmentRows } = await supabase
      .from("projects_seminars")
      .select("id, department")
      .in("id", itemIds);

    (departmentRows || []).forEach((row) => {
      if (row.department && row.department.trim()) {
        departmentMap.set(row.id, row.department);
      }
    });
  }

  const rows: ProjectSeminarTableRow[] = (items || []).map((item) => {
    const semester = (item.latest_semester || {}) as { term?: string; year?: number };
    const department =
      (departmentMap.get(item.id) ||
        (item.details &&
          typeof item.details === "object" &&
          !Array.isArray(item.details) &&
          typeof (item.details as Record<string, unknown>).department === "string" &&
          (item.details as Record<string, unknown>).department) ||
        "-") as string;

    return {
      id: item.id,
      title: item.title || "",
      courseCode: item.course_code || "",
      university: item.university || "",
      category: item.category || "",
      department,
      enrolled: Boolean(enrollmentMap.get(item.id)),
      credit: item.credit ?? null,
      semesterLabel: semester.term && semester.year ? `${semester.term} ${semester.year}` : "-",
      url: item.url || null,
    };
  });

  const pages = Math.max(1, Math.ceil((count || 0) / size));

  return NextResponse.json({
    items: (items || []).map((item) => ({
      id: item.id,
      title: item.title || "",
      course_code: item.course_code || "",
      university: item.university || "",
      category: item.category || "",
      credit: item.credit ?? null,
      url: item.url || null,
      latest_semester: item.latest_semester || null,
      enrolled: Boolean(enrollmentMap.get(item.id)),
    })),
    rows,
    total: count || 0,
    page,
    size,
    pages,
  });
}
