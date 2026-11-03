/**
 * Lazy chunk for the Home "Agentic Security Challenge": the quiz generator (which pulls in every
 * dataset) and the Quiz component load only after "Start the challenge" is clicked.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Quiz } from "@/components/quiz/Quiz";
import { buildChallengeQuiz, CHALLENGE_TITLE } from "@/data/quizzes";

export default function ChallengeQuiz() {
  const [attempt, setAttempt] = useState(0);
  const quiz = useMemo(() => buildChallengeQuiz({ attempt }), [attempt]);
  const ref = useRef<HTMLDivElement>(null);

  // Move focus into the quiz once it has loaded so keyboard users land on question 1.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div ref={ref} tabIndex={-1} className="outline-none">
      <p className="sr-only" aria-live="polite">
        {CHALLENGE_TITLE} loaded: {quiz.questions.length} questions.
      </p>
      <Quiz
        quizId={quiz.id}
        title={CHALLENGE_TITLE}
        questions={quiz.questions}
        onNewQuestions={() => setAttempt((a) => a + 1)}
      />
    </div>
  );
}
