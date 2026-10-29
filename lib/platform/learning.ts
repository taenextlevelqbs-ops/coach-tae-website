export function achievements(
  lessons: { id: string; level?: string }[],
  progress: { lesson_id: string; score: number | null }[],
) {
  const passed = new Set(
    progress
      .filter((p) => p.score === null || p.score >= 70)
      .map((p) => p.lesson_id),
  );
  const count = lessons.filter((l) => passed.has(l.id)).length;
  const badges: { name: string; description: string }[] = [];
  if (count >= 1)
    badges.push({
      name: "First rep",
      description: "Completed your first published lesson with a passing quiz.",
    });
  if (count >= 5)
    badges.push({
      name: "Film room five",
      description: "Passed five published lessons.",
    });
  for (const level of ["beginner", "intermediate", "advanced"]) {
    const path = lessons.filter((l) => (l.level || "beginner") === level);
    if (path.length && path.every((l) => passed.has(l.id)))
      badges.push({
        name: `${level[0].toUpperCase() + level.slice(1)} path complete`,
        description: `Passed every current published lesson in the ${level} path.`,
      });
  }
  return badges;
}
