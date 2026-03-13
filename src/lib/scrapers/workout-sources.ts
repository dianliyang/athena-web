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
}: {
  semester?: string;
  category?: string;
  source?: "cau-sport" | "urban-apes";
}): Promise<WorkoutSourceBatch[]> {
  if (source === "urban-apes") {
    const urbanApes = new UrbanApes();
    return [
      {
        source: "Urban Apes",
        workouts: await urbanApes.retrieveWorkouts(category),
      },
    ];
  }

  const cauSport = new CAUSport();
  if (semester) cauSport.semester = semester;

  return [
    {
      source: "CAU Kiel Sportzentrum",
      workouts: await cauSport.retrieveWorkouts(category),
    },
  ];
}
