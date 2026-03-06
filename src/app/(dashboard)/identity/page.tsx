import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Clock3,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getUser, createClient } from "@/lib/supabase/server";
import { getLanguage } from "@/actions/language";
import { getDictionary } from "@/lib/dictionary";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LearningProfileChart from "@/components/identity/LearningProfileChart";
import SecurityIdentitySection from "@/components/identity/SecurityIdentitySection";

export const dynamic = "force-dynamic";

function formatRelativeLastActive(date: Date | null, lang: string) {
  if (!date) return "No recent activity";

  const diffDays = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000))
  );

  if (diffDays === 0) return "Active today";
  if (diffDays === 1) return "Active yesterday";

  return `Active ${diffDays} days ago • ${date.toLocaleDateString(lang, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export default async function IdentityPage() {
  const [user, lang, supabase] = await Promise.all([getUser(), getLanguage(), createClient()]);

  const [dict, { data: enrolledData }, completedCoursesRes] = await Promise.all([
    getDictionary(lang),
    user
      ? supabase
          .from("user_courses")
          .select("course_id, status, progress, updated_at, courses!inner(subdomain)")
          .eq("user_id", user.id)
          .neq("status", "hidden")
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("courses")
          .select(`
            id, university, course_code, title, units, credit, url, description, details, is_hidden,
            uc:user_courses!inner(status, progress, updated_at, gpa, score),
            semesters:course_semesters(semesters(term, year))
          `)
          .eq("user_courses.user_id", user.id)
          .eq("user_courses.status", "completed")
          .neq("is_hidden", true)
          .order("updated_at", { foreignTable: "user_courses", ascending: false })
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (!user) {
    return <div className="p-10 text-center">{dict.dashboard.identity.user_not_found}</div>;
  }

  const email = user.email;
  const name = user.user_metadata?.full_name || email?.split("@")[0] || "User";
  const provider =
    typeof user.app_metadata?.provider === "string" ? user.app_metadata.provider : undefined;

  const enrolledIds = enrolledData?.map((row) => row.course_id) || [];
  const statusCounts: Record<string, number> = {};
  enrolledData?.forEach((row) => {
    const status = row.status ?? "unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  let universityCount = 0;
  let allFieldStats: { name: string; count: number }[] = [];

  if (enrolledIds.length > 0) {
    const [uniRes, fieldRes] = await Promise.all([
      supabase.from("courses").select("university").in("id", enrolledIds),
      supabase.from("course_fields").select("fields(name)").in("course_id", enrolledIds),
    ]);

    universityCount = new Set(uniRes.data?.map((row) => row.university)).size;

    const fieldCounts: Record<string, number> = {};
    (fieldRes.data as { fields: { name: string } | null }[] | null)?.forEach((row) => {
      if (row.fields?.name) {
        fieldCounts[row.fields.name] = (fieldCounts[row.fields.name] || 0) + 1;
      }
    });

    allFieldStats = Object.entries(fieldCounts)
      .map(([fieldName, count]) => ({ name: fieldName, count }))
      .sort((a, b) => b.count - a.count);
  }

  const completedCount = statusCounts.completed || 0;
  const enrolledCount = enrolledData?.length || 0;

  void completedCoursesRes;

  const lastActiveData = enrolledData?.sort(
    (a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime()
  )[0];
  const lastActiveDate = lastActiveData?.updated_at ? new Date(lastActiveData.updated_at) : null;
  const nowMs = lastActiveDate?.getTime() ?? 0;
  const dayMs = 24 * 60 * 60 * 1000;

  const recentUpdates30 = (enrolledData || []).filter((row) => {
    if (!row.updated_at) return false;
    const ts = new Date(row.updated_at).getTime();
    return Number.isFinite(ts) && nowMs - ts <= 30 * dayMs;
  }).length;

  const inProgressRows = (enrolledData || []).filter((row) => row.status === "in_progress");
  const inProgressCount = inProgressRows.length;
  const stalledCount = inProgressRows.filter((row) => {
    if (!row.updated_at) return true;
    const ts = new Date(row.updated_at).getTime();
    return !Number.isFinite(ts) || nowMs - ts > 14 * dayMs;
  }).length;
  const avgProgress =
    inProgressRows.length > 0
      ? Math.round(
          inProgressRows.reduce((sum, row) => sum + Number(row.progress || 0), 0) /
            inProgressRows.length
        )
      : 0;
  const dominantField = allFieldStats[0]?.name || "Undeclared";
  const focusCount = allFieldStats.length;
  const identityLevel = Math.floor(completedCount / 2) + 1;
  const completionRate =
    enrolledCount > 0 ? Math.round((completedCount / enrolledCount) * 100) : 0;

  const profileStats = [
    {
      label: "Enrolled",
      value: enrolledCount,
      tone: "text-[#111827]",
      icon: GraduationCap,
      helper: "Active learning inventory",
    },
    {
      label: "Completed",
      value: completedCount,
      tone: "text-[#0f766e]",
      icon: BadgeCheck,
      helper: `${completionRate}% completion rate`,
    },
    {
      label: "Universities",
      value: universityCount,
      tone: "text-[#1d4ed8]",
      icon: Building2,
      helper: "Academic sources explored",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      tone: "text-[#b45309]",
      icon: Activity,
      helper: `${avgProgress}% average progress`,
    },
  ];

  return (
    <main className="w-full space-y-6 px-4 pb-4">
      <section className="sticky top-0 z-20 -mx-4 bg-background/95 px-4 pb-5 pt-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Identity</h1>
          <p className="text-sm text-muted-foreground">
            Profile, learning signals, and account posture.
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#e7e2d8]">
        <div className="grid gap-0 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="p-5 sm:p-7 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]">
                      Identity
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-black/10 text-[#475569]">
                      LVL {identityLevel}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#111827] sm:text-4xl">
                      {name}
                    </h1>
                    <p className="max-w-2xl text-sm leading-6 text-[#475569] sm:text-[15px]">
                      A compact view of your academic identity, momentum, and learned territory.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#475569]">
                    <span>{email}</span>
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-[#111827]" />
                      {provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : "Secure account"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4 text-[#111827]" />
                      {formatRelativeLastActive(lastActiveDate, lang)}
                    </span>
                  </div>
              </div>
              <div className="min-w-[180px] rounded-2xl border border-black/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#64748b]">Primary focus</p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#111827]">
                  {dominantField}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">
                  {focusCount} tracked domains across your current learning graph.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {profileStats.map((item) => (
                <Card
                  key={item.label}
                  className="border-black/5 bg-transparent shadow-none"
                >
                  <CardContent className="flex items-start justify-between p-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[#64748b]">
                        {item.label}
                      </p>
                      <p className={`mt-2 text-2xl font-semibold tracking-[-0.03em] ${item.tone}`}>
                        {item.value}
                      </p>
                      <p className="mt-1 text-xs text-[#64748b]">{item.helper}</p>
                    </div>
                    <item.icon className="h-5 w-5 text-[#111827]" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="border-t border-black/5 p-5 xl:border-l xl:border-t-0 sm:p-7 lg:p-8">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#64748b]">
                  Progress pulse
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#111827]">
                  Keep the signal clean.
                </h2>
              </div>
              <div className="grid gap-3">
                <div className="rounded-2xl border border-black/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#64748b]">
                        Updated 30 days
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-[#111827]">{recentUpdates30}</p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-[#64748b]" />
                  </div>
                </div>
                <div className="rounded-2xl border border-black/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#64748b]">
                    Stalled tracks
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[#111827]">{stalledCount}</p>
                  <p className="mt-2 text-sm text-[#64748b]">
                    In-progress items without recent movement over the last 14 days.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#64748b]">
                    Current posture
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full">
                      {avgProgress}% avg progress
                    </Badge>
                    <Badge variant="outline" className="rounded-full">
                      {completionRate}% completion
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-[#ebe6dc]">
          <CardHeader className="border-b border-[#f2ede4] pb-4">
            <div className="flex items-center gap-2 text-[#111827]">
              <Sparkles className="h-4 w-4" />
              <CardTitle className="text-lg tracking-[-0.02em]">Learning Identity</CardTitle>
            </div>
            <p className="text-sm text-[#64748b]">{dict.dashboard.identity.neural_map}</p>
          </CardHeader>
          <CardContent className="p-5">
            <LearningProfileChart
              data={allFieldStats}
              unitLabel={dict.dashboard.identity.units}
              emptyText={dict.dashboard.identity.no_data}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <SecurityIdentitySection view="identity" provider={provider} />
          <SecurityIdentitySection view="account" provider={provider} />
        </div>
      </section>

    </main>
  );
}
