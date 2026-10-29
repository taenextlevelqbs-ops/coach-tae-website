export type GradedQuestion = {
  prompt: string;
  options: string[];
  answer: number;
  explanation?: string;
};
export function gradeQuiz(questions: GradedQuestion[], answers: number[]) {
  if (
    questions.length !== answers.length ||
    answers.some(
      (a, i) =>
        !Number.isInteger(a) || a < 0 || a >= questions[i].options.length,
    )
  )
    throw new RangeError("Answer every question with a valid choice.");
  const correct = questions.filter((q, i) => q.answer === answers[i]).length;
  return {
    score: questions.length
      ? Math.round((100 * correct) / questions.length)
      : null,
    feedback: questions.map((q, i) => ({
      prompt: q.prompt,
      correct: answers[i] === q.answer,
      correct_option: q.options[q.answer],
      explanation:
        q.explanation ||
        "Review the lesson and discuss this read with your coach.",
    })),
  };
}
