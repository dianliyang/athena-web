import { CAUSport } from "./cau-sport";
import { UrbanApes } from "./urban-apes";
import type { WorkoutCourse } from "./cau-sport";

export type WorkoutSourceBatch = {
  source: string;
  workouts: WorkoutCourse[];
};

export async function retrieveWorkoutSourceBatches({
  semester,
  category,
  source,
  sources,
}: {
  semester?: string;
  category?: string;
  source?: "cau-sport" | "urban-apes";
  sources?: Array<"cau-sport" | "urban-apes">;
}): Promise<WorkoutSourceBatch[]> {
  const selectedSources = sources?.length
    ? Array.from(new Set(sources))
    : source
      ? [source]
      : ["cau-sport"];

  const batches: WorkoutSourceBatch[] = [];

  if (selectedSources.includes("cau-sport")) {
    const cauSport = new CAUSport();
    if (semester) cauSport.semester = semester;

    batches.push({
      source: "CAU Kiel Sportzentrum",
      workouts: await cauSport.retrieveWorkouts(category),
    });
  }

  if (selectedSources.includes("urban-apes")) {
    const urbanApes = new UrbanApes();
    batches.push({
      source: "Urban Apes",
      workouts: await urbanApes.retrieveWorkouts(category),
    });
  }

  return batches;
}
