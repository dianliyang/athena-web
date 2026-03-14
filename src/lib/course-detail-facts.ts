export function formatCourseTermLabels(
  relatedSemesters: Array<{ semesters?: { term?: string; year?: number } | null }> | null | undefined,
  latestSemester: { term?: string; year?: number } | null | undefined,
): string[] {
  const labels =
    (relatedSemesters || [])
      .map((item) => {
        const semester = item?.semesters;
        if (!semester?.term || semester.year == null) return null;
        return `${semester.term} ${semester.year}`;
      })
      .filter((label): label is string => Boolean(label));

  if (labels.length > 0) return labels;
  if (latestSemester?.term && latestSemester.year != null) {
    return [`${latestSemester.term} ${latestSemester.year}`];
  }
  return [];
}
