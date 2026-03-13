import { beforeEach, describe, expect, test, vi } from "vitest";

const cauRetrieveWorkouts = vi.fn();
const urbanRetrieveWorkouts = vi.fn();

vi.mock("@/lib/scrapers/cau-sport", () => ({
  CAUSport: class {
    semester?: string;

    retrieveWorkouts(category?: string) {
      return cauRetrieveWorkouts(category, this.semester);
    }
  },
}));

vi.mock("@/lib/scrapers/urban-apes", () => ({
  UrbanApes: class {
    retrieveWorkouts(category?: string) {
      return urbanRetrieveWorkouts(category);
    }
  },
}));

describe("retrieveWorkoutSourceBatches", () => {
  beforeEach(() => {
    cauRetrieveWorkouts.mockReset();
    urbanRetrieveWorkouts.mockReset();
    cauRetrieveWorkouts.mockResolvedValue([{ source: "CAU Kiel Sportzentrum", courseCode: "cau-1" }]);
    urbanRetrieveWorkouts.mockResolvedValue([{ source: "Urban Apes", courseCode: "urban-1" }]);
  });

  test("refresh all returns only CAU Sport batches by default", async () => {
    const { retrieveWorkoutSourceBatches } = await import("@/lib/scrapers/workout-sources");

    const batches = await retrieveWorkoutSourceBatches({});

    expect(batches.map((batch) => batch.source)).toEqual(["CAU Kiel Sportzentrum"]);
    expect(cauRetrieveWorkouts).toHaveBeenCalledWith(undefined, undefined);
    expect(urbanRetrieveWorkouts).not.toHaveBeenCalled();
  });

  test("explicit urban-apes refresh returns only the Urban Apes batch", async () => {
    const { retrieveWorkoutSourceBatches } = await import("@/lib/scrapers/workout-sources");

    const batches = await retrieveWorkoutSourceBatches({ source: "urban-apes" });

    expect(batches.map((batch) => batch.source)).toEqual(["Urban Apes"]);
    expect(urbanRetrieveWorkouts).toHaveBeenCalledWith(undefined);
    expect(cauRetrieveWorkouts).not.toHaveBeenCalled();
  });

  test("multi-source refresh returns CAU and Urban Apes batches together", async () => {
    const { retrieveWorkoutSourceBatches } = await import("@/lib/scrapers/workout-sources");

    const batches = await retrieveWorkoutSourceBatches({ sources: ["cau-sport", "urban-apes"] });

    expect(batches.map((batch) => batch.source)).toEqual([
      "CAU Kiel Sportzentrum",
      "Urban Apes",
    ]);
    expect(cauRetrieveWorkouts).toHaveBeenCalledWith(undefined, undefined);
    expect(urbanRetrieveWorkouts).toHaveBeenCalledWith(undefined);
  });
});
