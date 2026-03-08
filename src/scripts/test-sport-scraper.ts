import { CAUSport } from "../lib/scrapers/cau-sport";
import { SupabaseDatabase } from "../lib/supabase/server";

async function main() {
  const scraper = new CAUSport();
  const shouldSave = process.argv.includes("--save");
  const db = shouldSave ? new SupabaseDatabase() : null;

  const testPages = [
    "_Schwimmkurse_Erwachsene.html",
    "_Boxen.html",
    "_Yoga__Hatha_Yoga.html",
    "_Klettern.html",
    "_Gesellschaftstanz.html",
    "_Rueckenfit.html",
  ];

  const BASE = "https://server.sportzentrum.uni-kiel.de/angebote/aktueller_zeitraum";

  const allWorkouts = [];

  for (const page of testPages) {
    const url = `${BASE}/${page}`;
    const html = await scraper.fetchPage(url);
    const workouts = await scraper.parseWorkouts(html, url);

    console.log(`\n=== ${page} (${workouts.length} courses) ===`);
    for (const w of workouts) {
      console.log(
        `  ${w.courseCode} | ${w.title}` +
        `\n    EN: ${w.titleEn}` +
        `\n    Category: ${w.category} → ${w.categoryEn}` +
        `\n    ${w.dayOfWeek} ${w.startTime}-${w.endTime}` +
        `\n    Location: ${w.location} → ${w.locationEn}` +
        `\n    Instructor: ${w.instructor}` +
        `\n    Status: ${w.bookingStatus}` +
        `\n`
      );
      allWorkouts.push(w);
    }
  }

  if (shouldSave && db && allWorkouts.length > 0) {
    console.log(`\n[Test] Saving ${allWorkouts.length} workouts to database...`);
    await db.saveWorkouts(allWorkouts);
    console.log("[Test] Save complete.");
  }
}

main().catch(console.error);
