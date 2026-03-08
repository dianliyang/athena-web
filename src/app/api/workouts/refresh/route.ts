import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { CAUSport } from "@/lib/scrapers/cau-sport";
import { SupabaseDatabase, createAdminClient, getUser } from "@/lib/supabase/server";
import { completeScraperJob, failScraperJob, startScraperJob } from "@/lib/scrapers/scraper-jobs";

export async function POST(req: Request) {
  const startedAtMs = Date.now();
  let jobId: number | null = null;
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const category = body?.category ? String(body.category) : undefined;

    jobId = await startScraperJob({
      university: "cau-sport",
      trigger: "api",
      triggeredByUserId: user.id,
      forceUpdate: true,
      jobType: "workouts",
      meta: { endpoint: "/api/workouts/refresh", category },
    });

    const scraper = new CAUSport();
    const workouts = await scraper.retrieveWorkouts(category);

    const supabase = createAdminClient();
    const source = "CAU Kiel Sportzentrum";

    // Delete workouts for this source (and optionally a specific category).
    // Two separate deletes are used because .or() breaks when values contain spaces.
    let deleteError: { message: string } | null = null;

    if (category) {
      // The UI sends the English display name → try category_en first, then German category
      const [r1, r2] = await Promise.all([
        supabase.from("workouts").delete().eq("source", source).eq("category_en", category),
        supabase.from("workouts").delete().eq("source", source).eq("category", category),
      ]);
      deleteError = r1.error || r2.error || null;
    } else {
      const { error } = await supabase.from("workouts").delete().eq("source", source);
      deleteError = error;
    }

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 },
      );
    }

    if (workouts.length > 0) {
      const db = new SupabaseDatabase();
      await db.saveWorkouts(workouts);
    }

    await completeScraperJob(jobId, {
      courseCount: workouts.length,
      durationMs: Date.now() - startedAtMs,
      meta: {
        saved_workouts: workouts.length,
        source,
        category,
      },
    });

    revalidatePath("/workouts");
    return NextResponse.json({ success: true, count: workouts.length });
  } catch (error) {
    await failScraperJob(jobId, error, Date.now() - startedAtMs);
    console.error("[workouts/refresh] failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
