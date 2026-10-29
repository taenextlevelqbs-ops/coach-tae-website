"use client";
type Q = {
  prompt: string;
  options: string[];
  answer: number;
  explanation?: string;
};
export default function QuizEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  let questions: Q[];
  try {
    questions = JSON.parse(value);
    if (!Array.isArray(questions)) throw new Error();
  } catch {
    return (
      <p className="notice error">
        The stored quiz needs valid JSON before it can be edited.
      </p>
    );
  }
  function update(index: number, patch: Partial<Q>) {
    onChange(
      JSON.stringify(
        questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
      ),
    );
  }
  return (
    <div className="stack">
      <h3>Quiz questions & explanations</h3>
      <p className="muted">
        Correct choices and explanations are checked on the server and shown to
        learners after submission.
      </p>
      {questions.map((q, i) => (
        <fieldset className="stack" key={i}>
          <legend>Question {i + 1}</legend>
          <label>
            Question prompt
            <textarea
              required
              maxLength={500}
              value={q.prompt}
              onChange={(e) => update(i, { prompt: e.target.value })}
            />
          </label>
          {q.options.map((option, j) => (
            <div className="row" key={j}>
              <label>
                Choice {j + 1}
                <input
                  required
                  maxLength={300}
                  value={option}
                  onChange={(e) =>
                    update(i, {
                      options: q.options.map((v, k) =>
                        k === j ? e.target.value : v,
                      ),
                    })
                  }
                />
              </label>
              {q.options.length > 2 && (
                <button
                  className="secondary"
                  type="button"
                  onClick={() =>
                    update(i, {
                      options: q.options.filter((_, k) => k !== j),
                      answer:
                        q.answer === j
                          ? 0
                          : q.answer > j
                            ? q.answer - 1
                            : q.answer,
                    })
                  }
                >
                  Remove choice {j + 1}
                </button>
              )}
            </div>
          ))}
          {q.options.length < 10 && (
            <button
              type="button"
              className="secondary"
              onClick={() => update(i, { options: [...q.options, ""] })}
            >
              Add choice
            </button>
          )}
          <label>
            Correct choice
            <select
              value={q.answer}
              onChange={(e) => update(i, { answer: Number(e.target.value) })}
            >
              {q.options.map((_, j) => (
                <option value={j} key={j}>
                  Choice {j + 1}
                </option>
              ))}
            </select>
          </label>
          <label>
            Why this answer is correct
            <textarea
              required
              maxLength={2000}
              value={q.explanation || ""}
              onChange={(e) => update(i, { explanation: e.target.value })}
            />
          </label>
          <button
            type="button"
            className="danger"
            onClick={() =>
              onChange(JSON.stringify(questions.filter((_, j) => i !== j)))
            }
          >
            Remove question
          </button>
        </fieldset>
      ))}
      {questions.length < 30 && (
        <button
          type="button"
          className="secondary"
          onClick={() =>
            onChange(
              JSON.stringify([
                ...questions,
                { prompt: "", options: ["", ""], answer: 0, explanation: "" },
              ]),
            )
          }
        >
          Add quiz question
        </button>
      )}
    </div>
  );
}
