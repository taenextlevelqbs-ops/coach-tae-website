import { test } from "node:test";
import assert from "node:assert/strict";
import { curriculum } from "../lib/platform/curriculum";
import { achievements } from "../lib/platform/learning";
test("curriculum covers all requested structures and concepts with substantive original text and explanations", () => {
  assert.equal(curriculum.length, 41);
  assert.equal(new Set(curriculum.map((l) => l.slug)).size, 41);
  assert.ok(
    curriculum.reduce((n, l) => n + l.body.split(/\s+/).length, 0) > 8000,
  );
  for (const key of [
    "cover-0",
    "cover-1",
    "cover-2",
    "cover-3",
    "cover-4",
    "cover-6",
    "slant-flat",
    "stick",
    "snag",
    "mesh",
    "smash",
    "flood",
    "four-verticals",
    "levels",
    "curl-flat",
    "rpo",
    "warmups",
    "stretching",
    "mobility",
    "development-plan",
    "age-appropriate",
  ])
    assert.ok(
      curriculum.some((l) => l.slug === key),
      key,
    );
  for (const l of curriculum) {
    assert.ok(l.body.split(/\s+/).length >= 150, l.slug);
    assert.ok(l.questions.length > 0);
    for (const q of l.questions) {
      assert.ok(q.answer >= 0 && q.answer < q.options.length);
      assert.ok(q.explanation.length > 30);
    }
  }
  assert.ok(curriculum.some((l) => l.diagram === "cover6"));
});
test("achievement badges require recorded passing progress and cannot be earned from failed quizzes or unpublished IDs", () => {
  const lessons = [
    { id: "a", level: "beginner" },
    { id: "b", level: "beginner" },
    { id: "c", level: "advanced" },
  ];
  assert.equal(achievements(lessons, []).length, 0);
  assert.equal(
    achievements(lessons, [
      { lesson_id: "a", score: 0 },
      { lesson_id: "hidden", score: 100 },
    ]).length,
    0,
  );
  assert.deepEqual(
    achievements(lessons, [
      { lesson_id: "a", score: 100 },
      { lesson_id: "b", score: 100 },
    ]).map((b) => b.name),
    ["First rep", "Beginner path complete"],
  );
});

test("server grading returns useful explanations and rejects skipped or out-of-range choices", async () => {
  const { gradeQuiz } = await import("../lib/platform/grading");
  const questions = [
    {
      prompt: "Pressure?",
      options: ["Confirm rush and lane", "Throw blindly"],
      answer: 0,
      explanation:
        "A dropping defender can replace the anticipated hot window.",
    },
  ];
  assert.equal(gradeQuiz(questions, [0]).score, 100);
  assert.equal(gradeQuiz(questions, [1]).score, 0);
  assert.match(
    gradeQuiz(questions, [1]).feedback[0].explanation,
    /dropping defender/,
  );
  assert.throws(() => gradeQuiz(questions, []), /valid choice/);
  assert.throws(() => gradeQuiz(questions, [5]), /valid choice/);
  assert.equal(gradeQuiz([], []).score, null);
});
